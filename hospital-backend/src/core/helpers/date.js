const calculateAge = (dob) => {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
};

const toIST = (date) => {
    const d = date ? new Date(date) : new Date();
    return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
};

const formatDateISO = (date) => {
    const d = date ? new Date(date) : new Date();
    return d.toISOString().split('T')[0];
};

module.exports = { calculateAge, toIST, formatDateISO };
