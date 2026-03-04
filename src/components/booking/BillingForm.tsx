import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface BillingData {
  billing_type: "individual" | "company";
  billing_first_name: string;
  billing_last_name: string;
  billing_email: string;
  billing_phone: string;
  billing_address: string;
  company_name?: string;
  cui?: string;
  registration_number?: string;
  company_address?: string;
}

interface BillingFormProps {
  onChange: (data: BillingData) => void;
}

export function BillingForm({ onChange }: BillingFormProps) {
  const [billingType, setBillingType] = useState<"individual" | "company">("individual");
  const [formData, setFormData] = useState<BillingData>({
    billing_type: "individual",
    billing_first_name: "",
    billing_last_name: "",
    billing_email: "",
    billing_phone: "",
    billing_address: "",
  });

  const update = (field: keyof BillingData, value: string) => {
    const next = { ...formData, [field]: value };
    setFormData(next);
    onChange(next);
  };

  const handleTypeChange = (type: "individual" | "company") => {
    setBillingType(type);
    const next = { ...formData, billing_type: type };
    setFormData(next);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium text-foreground">Date facturare</Label>

      <RadioGroup
        value={billingType}
        onValueChange={(v) => handleTypeChange(v as "individual" | "company")}
        className="flex gap-4"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="individual" id="billing-individual" />
          <Label htmlFor="billing-individual" className="cursor-pointer">Persoană fizică</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="company" id="billing-company" />
          <Label htmlFor="billing-company" className="cursor-pointer">Firmă</Label>
        </div>
      </RadioGroup>

      {billingType === "individual" ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="bf-fname" className="text-xs text-muted-foreground">Nume</Label>
            <Input id="bf-fname" placeholder="Popescu" value={formData.billing_last_name} onChange={(e) => update("billing_last_name", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="bf-lname" className="text-xs text-muted-foreground">Prenume</Label>
            <Input id="bf-lname" placeholder="Ion" value={formData.billing_first_name} onChange={(e) => update("billing_first_name", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="bf-email" className="text-xs text-muted-foreground">Email</Label>
            <Input id="bf-email" type="email" placeholder="email@exemplu.ro" value={formData.billing_email} onChange={(e) => update("billing_email", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="bf-phone" className="text-xs text-muted-foreground">Telefon</Label>
            <Input id="bf-phone" placeholder="07XX XXX XXX" value={formData.billing_phone} onChange={(e) => update("billing_phone", e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label htmlFor="bf-addr" className="text-xs text-muted-foreground">Adresă</Label>
            <Input id="bf-addr" placeholder="Strada, nr., oraș" value={formData.billing_address} onChange={(e) => update("billing_address", e.target.value)} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label htmlFor="bf-company" className="text-xs text-muted-foreground">Denumire firmă</Label>
            <Input id="bf-company" placeholder="S.C. Exemplu S.R.L." value={formData.company_name || ""} onChange={(e) => update("company_name", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="bf-cui" className="text-xs text-muted-foreground">CUI</Label>
            <Input id="bf-cui" placeholder="RO12345678" value={formData.cui || ""} onChange={(e) => update("cui", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="bf-reg" className="text-xs text-muted-foreground">Nr. Reg. Com.</Label>
            <Input id="bf-reg" placeholder="J40/1234/2020" value={formData.registration_number || ""} onChange={(e) => update("registration_number", e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label htmlFor="bf-caddr" className="text-xs text-muted-foreground">Adresă firmă</Label>
            <Input id="bf-caddr" placeholder="Strada, nr., oraș" value={formData.company_address || ""} onChange={(e) => update("company_address", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="bf-cemail" className="text-xs text-muted-foreground">Email</Label>
            <Input id="bf-cemail" type="email" placeholder="contact@firma.ro" value={formData.billing_email} onChange={(e) => update("billing_email", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="bf-cphone" className="text-xs text-muted-foreground">Telefon</Label>
            <Input id="bf-cphone" placeholder="07XX XXX XXX" value={formData.billing_phone} onChange={(e) => update("billing_phone", e.target.value)} />
          </div>
        </div>
      )}
    </div>
  );
}
