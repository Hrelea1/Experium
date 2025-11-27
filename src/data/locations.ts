// Romanian regions, counties, and cities structure for filtering

export const romanianLocations = {
  Transilvania: {
    counties: {
      Brașov: ["Brașov", "Bran", "Predeal", "Poiana Brașov"],
      Cluj: ["Cluj-Napoca", "Turda", "Huedin"],
      Sibiu: ["Sibiu", "Mediaș", "Cisnădie"],
      "Alba": ["Alba Iulia", "Sebeș", "Blaj"],
      Mureș: ["Târgu Mureș", "Sighișoara", "Reghin"],
      Hunedoara: ["Deva", "Hunedoara", "Orăștie"],
    },
  },
  Bucovina: {
    counties: {
      Suceava: ["Suceava", "Vatra Dornei", "Rădăuți", "Gura Humorului"],
      Botoșani: ["Botoșani", "Dorohoi"],
    },
  },
  Maramureș: {
    counties: {
      Maramureș: ["Baia Mare", "Sighetu Marmației", "Borșa", "Vișeu de Sus"],
    },
  },
  Dobrogea: {
    counties: {
      Constanța: ["Constanța", "Mangalia", "Eforie Nord", "Mamaia"],
      Tulcea: ["Tulcea", "Sulina", "Sfântu Gheorghe"],
    },
  },
  Banat: {
    counties: {
      Timiș: ["Timișoara", "Lugoj"],
      "Caraș-Severin": ["Reșița", "Oravița"],
    },
  },
  Muntenia: {
    counties: {
      București: ["București"],
      Prahova: ["Ploiești", "Sinaia", "Bușteni", "Azuga"],
      Dâmbovița: ["Târgoviște"],
      Argeș: ["Pitești", "Curtea de Argeș"],
    },
  },
  Moldova: {
    counties: {
      Iași: ["Iași"],
      Bacău: ["Bacău"],
      Galați: ["Galați"],
      Neamț: ["Piatra Neamț"],
    },
  },
  Oltenia: {
    counties: {
      Dolj: ["Craiova"],
      Gorj: ["Târgu Jiu"],
      Vâlcea: ["Râmnicu Vâlcea", "Călimănești"],
    },
  },
};

export const regions = Object.keys(romanianLocations);

export function getCountiesForRegion(region: string): string[] {
  const regionData = romanianLocations[region as keyof typeof romanianLocations];
  return regionData ? Object.keys(regionData.counties) : [];
}

export function getCitiesForCounty(region: string, county: string): string[] {
  const regionData = romanianLocations[region as keyof typeof romanianLocations];
  if (!regionData) return [];
  return regionData.counties[county as keyof typeof regionData.counties] || [];
}
