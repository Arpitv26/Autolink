import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Car,
  ChevronRight,
  LogOut,
  Shield,
  Crown,
  Plus,
  Check,
  Mail,
} from "lucide-react";

// Vehicle data
const YEARS = Array.from({ length: 35 }, (_, i) => String(2026 - i));

const MAKES_MODELS: Record<string, string[]> = {
  ACURA: ["ILX", "Integra", "MDX", "NSX", "RDX", "TLX"],
  "ALFA ROMEO": ["Giulia", "Stelvio", "Tonale", "4C"],
  "ASTON MARTIN": ["DB11", "DB12", "DBX", "Vantage", "Valkyrie"],
  AUDI: ["A3", "A4", "A5", "A6", "A7", "A8", "Q3", "Q5", "Q7", "Q8", "RS3", "RS5", "RS6", "RS7", "R8", "e-tron GT", "TT"],
  BMW: ["2 Series", "3 Series", "4 Series", "5 Series", "7 Series", "8 Series", "X1", "X3", "X5", "X6", "X7", "M2", "M3", "M4", "M5", "M8", "Z4", "iX"],
  BUICK: ["Enclave", "Encore", "Envision"],
  CADILLAC: ["CT4", "CT5", "Escalade", "XT4", "XT5", "XT6", "LYRIQ"],
  CHEVROLET: ["Blazer", "Camaro", "Colorado", "Corvette", "Equinox", "Malibu", "Silverado", "Suburban", "Tahoe", "Traverse", "Trailblazer"],
  CHRYSLER: ["300", "Pacifica", "Shadow", "Voyager"],
  DODGE: ["Challenger", "Charger", "Durango", "Hornet"],
  FERRARI: ["296 GTB", "F8 Tributo", "Roma", "SF90", "812"],
  FORD: ["Bronco", "Edge", "Escape", "Explorer", "F-150", "Maverick", "Mustang", "Ranger"],
  GMC: ["Acadia", "Canyon", "Sierra", "Terrain", "Yukon"],
  HONDA: ["Accord", "Civic", "CR-V", "HR-V", "Odyssey", "Passport", "Pilot", "Ridgeline"],
  HYUNDAI: ["Elantra", "Ioniq 5", "Kona", "Palisade", "Santa Fe", "Sonata", "Tucson", "Veloster N"],
  INFINITI: ["Q50", "Q60", "QX50", "QX55", "QX60", "QX80"],
  JAGUAR: ["F-PACE", "F-TYPE", "XE", "XF"],
  JEEP: ["Cherokee", "Compass", "Gladiator", "Grand Cherokee", "Renegade", "Wrangler"],
  KIA: ["EV6", "Forte", "K5", "Seltos", "Sorento", "Soul", "Sportage", "Stinger", "Telluride"],
  LAMBORGHINI: ["Huracan", "Revuelto", "Urus"],
  "LAND ROVER": ["Defender", "Discovery", "Range Rover", "Range Rover Sport"],
  LEXUS: ["ES", "GX", "IS", "LC", "LX", "NX", "RC", "RX", "TX"],
  LINCOLN: ["Aviator", "Corsair", "Nautilus", "Navigator"],
  MASERATI: ["Ghibli", "GranTurismo", "Grecale", "Levante", "MC20"],
  MAZDA: ["CX-30", "CX-5", "CX-50", "CX-90", "Mazda3", "MX-5 Miata"],
  "MERCEDES-BENZ": ["A-Class", "C-Class", "CLA", "E-Class", "G-Class", "GLA", "GLC", "GLE", "GLS", "S-Class", "AMG GT"],
  MITSUBISHI: ["Eclipse Cross", "Outlander", "Outlander Sport"],
  NISSAN: ["Altima", "Ariya", "Frontier", "GTR", "Kicks", "Maxima", "Murano", "Pathfinder", "Rogue", "Sentra", "Titan", "Z"],
  PORSCHE: ["718", "911", "Cayenne", "Macan", "Panamera", "Taycan"],
  RAM: ["1500", "2500", "3500"],
  SUBARU: ["BRZ", "Crosstrek", "Forester", "Impreza", "Legacy", "Outback", "WRX"],
  TESLA: ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck"],
  TOYOTA: ["4Runner", "Camry", "Corolla", "GR86", "GR Supra", "Highlander", "Land Cruiser", "RAV4", "Sequoia", "Tacoma", "Tundra"],
  VOLKSWAGEN: ["Atlas", "Golf", "Golf GTI", "Golf R", "ID.4", "Jetta", "Taos", "Tiguan"],
  VOLVO: ["C40", "S60", "S90", "V60", "XC40", "XC60", "XC90"],
};

const MAKES = Object.keys(MAKES_MODELS).sort();

export function ProfilePage() {
  const [year, setYear] = useState<string>("");
  const [make, setMake] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [savedVehicle, setSavedVehicle] = useState<string | null>(
    "1992 CHRYSLER Shadow"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const availableModels = useMemo(() => {
    if (!make) return [];
    return MAKES_MODELS[make] || [];
  }, [make]);

  const handleMakeChange = (value: string) => {
    setMake(value);
    setModel("");
  };

  const handleSave = () => {
    if (!year || !make || !model) return;
    setIsSaving(true);
    setTimeout(() => {
      setSavedVehicle(`${year} ${make} ${model}`);
      setIsSaving(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    }, 600);
  };

  const canSave = year && make && model;

  return (
    <div className="px-5 pt-14 pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] text-gray-900 tracking-tight">Profile</h1>
        <p className="text-gray-500 mt-1 text-[15px]">
          Manage your account and garage.
        </p>
      </div>

      {/* Account Card */}
      <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
            <span className="text-white text-[15px]">AV</span>
          </div>
          <div className="min-w-0">
            <h3 className="text-gray-900 text-[15px] truncate">Account</h3>
            <div className="flex items-center gap-1.5 text-gray-500 text-[13px]">
              <Mail className="size-3.5 shrink-0" />
              <span className="truncate">arpitv2606@gmail.com</span>
            </div>
          </div>
        </div>
        <button className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group">
          <div className="flex items-center gap-2.5">
            <Shield className="size-4 text-gray-400" />
            <span className="text-[14px] text-gray-700">Data & Personal Info</span>
          </div>
          <ChevronRight className="size-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
        </button>
      </div>

      {/* Garage Card */}
      <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2.5 mb-1">
          <Car className="size-5 text-gray-900" />
          <h3 className="text-gray-900 text-[16px]">Garage</h3>
        </div>
        <p className="text-gray-500 text-[13px] mb-5 ml-[30px]">
          Your primary vehicle is used across AI, planner, and feed.
        </p>

        {/* Saved Vehicle Display */}
        {savedVehicle && (
          <div className="mb-5 px-4 py-3 bg-blue-50/70 border border-blue-100 rounded-xl">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-blue-600 text-[12px] tracking-wide uppercase">
                Primary vehicle
              </span>
            </div>
            <p className="text-gray-900 text-[15px] ml-[14px]">
              {savedVehicle}
            </p>
          </div>
        )}

        {/* Vehicle Selection */}
        <div className="space-y-4">
          {/* Year */}
          <div>
            <label className="text-[13px] text-gray-500 mb-1.5 block ml-1">
              Model Year
            </label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-12 rounded-xl bg-gray-50/80 border-gray-200/80 hover:border-gray-300 transition-colors text-[15px] px-4">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent className="max-h-[280px]">
                {YEARS.map((y) => (
                  <SelectItem key={y} value={y} className="text-[14px] py-2">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Make */}
          <div>
            <label className="text-[13px] text-gray-500 mb-1.5 block ml-1">
              Make
            </label>
            <Select value={make} onValueChange={handleMakeChange}>
              <SelectTrigger className="h-12 rounded-xl bg-gray-50/80 border-gray-200/80 hover:border-gray-300 transition-colors text-[15px] px-4">
                <SelectValue placeholder="Select make" />
              </SelectTrigger>
              <SelectContent className="max-h-[280px]">
                {MAKES.map((m) => (
                  <SelectItem key={m} value={m} className="text-[14px] py-2">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model */}
          <div>
            <label className="text-[13px] text-gray-500 mb-1.5 block ml-1">
              Model
            </label>
            <Select
              value={model}
              onValueChange={setModel}
              disabled={!make}
            >
              <SelectTrigger
                className={`h-12 rounded-xl border-gray-200/80 hover:border-gray-300 transition-colors text-[15px] px-4 ${
                  !make
                    ? "bg-gray-100/60 cursor-not-allowed"
                    : "bg-gray-50/80"
                }`}
              >
                <SelectValue
                  placeholder={
                    !make ? "Select a make first" : "Select model"
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-[280px]">
                {availableModels.map((m) => (
                  <SelectItem key={m} value={m} className="text-[14px] py-2">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={!canSave || isSaving}
          className={`w-full mt-5 h-12 rounded-xl text-[15px] transition-all duration-300 ${
            justSaved
              ? "bg-emerald-500 hover:bg-emerald-500"
              : "bg-gray-900 hover:bg-gray-800"
          }`}
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : justSaved ? (
            <>
              <Check className="size-4" />
              Vehicle Saved
            </>
          ) : (
            "Save Vehicle"
          )}
        </Button>
      </div>

      {/* Pro Upgrade Card */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 mb-4 text-white shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="size-4 text-amber-400" />
          <h3 className="text-[15px] text-white">Multiple Vehicles</h3>
          <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/30 text-[11px] px-1.5">
            PRO
          </Badge>
        </div>
        <p className="text-gray-400 text-[13px] mb-4 leading-relaxed">
          Free plan includes 1 active vehicle. Upgrade to Pro to save and switch
          between multiple cars.
        </p>
        <button className="w-full flex items-center justify-center gap-2 h-11 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl transition-colors text-[14px] text-white">
          <Plus className="size-4" />
          Add another vehicle
        </button>
      </div>

      {/* Log Out */}
      <button className="w-full flex items-center justify-center gap-2 h-12 mt-2 bg-white hover:bg-red-50 border border-gray-200 rounded-2xl transition-colors group">
        <LogOut className="size-4 text-red-500" />
        <span className="text-red-500 text-[15px]">Log out</span>
      </button>

      {/* Footer */}
      <p className="text-center text-gray-400 text-[12px] mt-6">
        AutoLink v1.0 &middot; Phase 1
      </p>
    </div>
  );
}
