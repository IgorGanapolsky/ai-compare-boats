export interface Boat {
    name: string;
    imageUrl?: string;
    features?: string[];
    keyFeatures?: string[];
    style?: string[];
    type?: string;
    engine?: string;
    hullMaterial?: string;
    price?: number;
    location?: string;
    length?: number | string;
    dimensions?: {
        lengthOverall?: string;
    };
    size?: number | string;
}

export interface FeatureAnalysis {
    matchRate: number;
    commonFeatures: string[];
    uniqueToUploaded: string[];
    uniqueToMatch: string[];
}

export interface DetailedComparisonProps {
    currentBoat: Boat;
    comparisonBoat: Boat;
    onClose: () => void;
}

export interface BoatColumnProps {
    boat: Boat;
    title: string;
    matchRate?: number;
    showPrice: boolean;
    showLocation: boolean;
}

export interface FeatureComparisonProps {
    featureAnalysis: FeatureAnalysis;
    comparisonBoatName: string;
} 