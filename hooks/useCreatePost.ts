import type { User } from '@supabase/supabase-js';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

const POST_IMAGE_BUCKET = 'post-images';
const MAX_POST_IMAGES = 5;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

type UseCreatePostResult = {
  images: ImagePicker.ImagePickerAsset[];
  picking: boolean;
  publishing: boolean;
  error: string | null;
  pickImages: () => Promise<void>;
  removeImage: (uri: string) => void;
  publish: (caption: string) => Promise<boolean>;
};

function getFileExtension(asset: ImagePicker.ImagePickerAsset): string {
  const byName = asset.fileName?.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
  if (byName) return byName;
  return asset.uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/)?.[1]?.toLowerCase() ?? 'jpg';
}

function getContentType(asset: ImagePicker.ImagePickerAsset, extension: string): string {
  if (asset.mimeType) return asset.mimeType;
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'heic') return 'image/heic';
  if (extension === 'heif') return 'image/heif';
  return 'image/jpeg';
}

function validateAssets(assets: ImagePicker.ImagePickerAsset[]): string | null {
  if (assets.length === 0) return 'Choose at least one photo.';
  if (assets.length > MAX_POST_IMAGES) return `Choose up to ${MAX_POST_IMAGES} photos.`;

  const invalidAsset = assets.find((asset) => {
    if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) return true;
    return Boolean(asset.mimeType && !asset.mimeType.startsWith('image/'));
  });

  return invalidAsset ? 'Each photo must be an image smaller than 8 MB.' : null;
}

export function useCreatePost(user: User | null): UseCreatePostResult {
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [picking, setPicking] = useState<boolean>(false);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const pickImages = useCallback(async (): Promise<void> => {
    setPicking(true);
    setError(null);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Photo access is required to create a post.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: MAX_POST_IMAGES,
        quality: 0.82,
      });

      if (result.canceled) return;
      const validationError = validateAssets(result.assets);
      if (validationError) {
        setError(validationError);
        return;
      }

      setImages(result.assets.slice(0, MAX_POST_IMAGES));
    } finally {
      setPicking(false);
    }
  }, []);

  const removeImage = useCallback((uri: string): void => {
    setImages((current) => current.filter((asset) => asset.uri !== uri));
  }, []);

  const publish = useCallback(
    async (caption: string): Promise<boolean> => {
      if (!user) {
        setError('Sign in before creating a post.');
        return false;
      }

      const validationError = validateAssets(images);
      if (validationError) {
        setError(validationError);
        return false;
      }

      setPublishing(true);
      setError(null);
      const uploadedPaths: string[] = [];

      try {
        const imageUrls: string[] = [];

        for (const [index, asset] of images.entries()) {
          const extension = getFileExtension(asset);
          const contentType = getContentType(asset, extension);
          const filePath = `${user.id}/${Date.now()}-${index}-${Math.random()
            .toString(36)
            .slice(2, 9)}.${extension}`;
          const response = await fetch(asset.uri);
          const fileBuffer = await response.arrayBuffer();
          const { error: uploadError } = await supabase.storage
            .from(POST_IMAGE_BUCKET)
            .upload(filePath, fileBuffer, {
              cacheControl: '3600',
              contentType,
              upsert: false,
            });

          if (uploadError) throw uploadError;
          uploadedPaths.push(filePath);

          const { data: publicUrlData } = supabase.storage
            .from(POST_IMAGE_BUCKET)
            .getPublicUrl(filePath);
          imageUrls.push(publicUrlData.publicUrl);
        }

        const trimmedCaption = caption.trim();
        const { error: insertError } = await supabase.from('posts').insert({
          user_id: user.id,
          caption: trimmedCaption || null,
          image_urls: imageUrls,
        });

        if (insertError) throw insertError;
        setImages([]);
        return true;
      } catch {
        if (uploadedPaths.length > 0) {
          await supabase.storage.from(POST_IMAGE_BUCKET).remove(uploadedPaths);
        }
        setError('Could not publish this post. Please try again.');
        return false;
      } finally {
        setPublishing(false);
      }
    },
    [images, user]
  );

  return {
    images,
    picking,
    publishing,
    error,
    pickImages,
    removeImage,
    publish,
  };
}
