import React, { useMemo } from 'react'

const useDateFormatter = (utcDateString, options = {}) => {
    const { includeTime = true, relativeTime = false } = options;

    const formattedDate = useMemo(() => {
        if (!utcDateString) return "N/A";

        const date = new Date(utcDateString);

        // If relative time is requested (e.g., "2 days ago")
        if (relativeTime) {
            const now = new Date();
            const seconds = Math.floor((now - date) / 1000);

            const intervals = {
                year: 31536000,
                month: 2592000,
                week: 604800,
                day: 86400,
                hour: 3600,
                minute: 60,
            };

            for (const [unit, secondsInUnit] of Object.entries(intervals)) {
                const interval = Math.floor(seconds / secondsInUnit);
                if (interval >= 1) {
                    return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
                }
            }
            return "Just now";
        }

        // Format in IST (with or without time)
        return date.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            ...(includeTime && {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            }),
        })

    }, [utcDateString, includeTime, relativeTime]);

    return formattedDate;
}

export default useDateFormatter
