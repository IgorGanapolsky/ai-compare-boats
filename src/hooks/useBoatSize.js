import { useCallback } from 'react';

export const useBoatSize = () => {
    const formatBoatSize = useCallback((size) => {
        if (!size) return 'N/A';

        const sizeStr = String(size);
        const match = sizeStr.match(/(\d+(?:\.\d+)?)/);
        if (!match) return sizeStr;

        const value = Math.round(parseFloat(match[1]));
        return `${value} ft`;
    }, []);

    const getBoatSize = useCallback((boat) => {
        if (!boat) return 'N/A';

        if (boat.length) {
            return formatBoatSize(boat.length);
        }

        if (boat.dimensions?.lengthOverall) {
            return boat.dimensions.lengthOverall;
        }

        if (boat.size) {
            return formatBoatSize(boat.size);
        }

        return 'N/A';
    }, [formatBoatSize]);

    return { getBoatSize };
}; 