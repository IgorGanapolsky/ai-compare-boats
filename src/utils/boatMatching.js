export const calculateMatchScore = (currentBoat, comparisonBoat) => {
  // Normalize boat data
  const normalizeBoatData = (boat) => ({
    type: boat.type?.toLowerCase().trim() || '',
    size: parseFloat(boat.length || boat.size || '0'),
    features: new Set([
      ...(boat.features || []),
      ...(boat.keyFeatures || []),
      ...(boat.style || [])
    ].map(f => f.toLowerCase().trim()))
  });

  const current = normalizeBoatData(currentBoat);
  const comparison = normalizeBoatData(comparisonBoat);

  // Type match (40% weight)
  const typeMatch = () => {
    const relatedTypes = {
      'sport fishing boat': ['express cruiser', 'center console', 'center console cabin boat'],
      'center console cabin boat': ['center console', 'sport fishing boat', 'express cruiser'],
      'express cruiser': ['sport fishing boat', 'center console cabin boat']
    };

    if (current.type === comparison.type) return 1;
    if (relatedTypes[current.type]?.includes(comparison.type)) return 0.8;
    if (Object.values(relatedTypes).some(types => 
      types.includes(current.type) && types.includes(comparison.type)
    )) return 0.6;
    return 0.2;
  };

  // Size match (30% weight)
  const sizeMatch = () => {
    const difference = Math.abs(current.size - comparison.size);
    if (difference <= 2) return 1;
    if (difference <= 5) return 0.8;
    if (difference <= 10) return 0.5;
    return 0.2;
  };

  // Feature match (30% weight)
  const featureMatch = () => {
    const commonFeatures = [...current.features].filter(f => 
      [...comparison.features].some(cf => cf.includes(f) || f.includes(cf))
    );
    return commonFeatures.length / Math.max(current.features.size, comparison.features.size);
  };

  const weights = {
    type: 0.4,
    size: 0.3,
    features: 0.3
  };

  const score = (typeMatch() * weights.type) + 
                (sizeMatch() * weights.size) + 
                (featureMatch() * weights.features);

  return Math.round(score * 100);
}; 