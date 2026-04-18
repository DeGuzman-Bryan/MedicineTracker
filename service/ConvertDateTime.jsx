import moment from "moment";

// CHANGE: Return a formatted string, not the Date object itself
export const FormatDate = (Timestamp) => {
    return moment(Timestamp).format('MM/DD/YYYY');
}

export const FormatDateForText = (date) => {
    if (!date) return '';
    return moment(date).format('MM/DD/YYYY');    
}

export const formatTime = (Timestamp) => {
    const date = new Date(Timestamp);
    return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

export const getDatesRange = (startDate, endDate) => {
    // Force moment to recognize the specific format we use
    const start = moment(startDate, 'MM/DD/YYYY');
    const end = moment(endDate, 'MM/DD/YYYY');
    const dates = [];

    if (!start.isValid()) return [];

    while (start.isSameOrBefore(end, 'day')) {
        dates.push(start.format('MM/DD/YYYY'));
        start.add(1, 'days');
    }
    return dates;
}

export const GetDateRangeToDisplay = () => {
    const dateList = [];
    for (let i = 0; i <= 7; i++) {
        const day = moment().add(i, 'days');
        dateList.push({
            date: day.format('DD'),
            day: day.format('ddd'),
            formattedDate: day.format('MM/DD/YYYY'),
        });
    }
    return dateList;
}