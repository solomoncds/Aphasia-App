/**
 * Sequences Data
 *
 * Fixed, ordered, overlearned sequences for automatic speech recitation:
 *   - Days of the Week
 *   - Months of the Year
 *   - Alphabet
 *   - Prayer
 */

export const SEQUENCE_SETS = [
    {
        id: 'days_of_week',
        title: 'Days of the Week',
        icon: '📅',
        description: '7 days · Sunday to Saturday',
        items: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    {
        id: 'months_of_year',
        title: 'Months of the Year',
        icon: '🗓️',
        description: '12 months · January to December',
        items: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    },
    {
        id: 'alphabet',
        title: 'Alphabet',
        icon: '🔤',
        description: '26 letters · A to Z',
        items: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
    },
    {
        id: 'personal_prayer',
        title: 'Prayer',
        icon: '🙏',
        description: '7 lines · Psalm 23:6',
        items: [
            'Surely goodness and mercy',
            'shall follow us',
            'all the days of our lives,',
            'and we shall abide',
            'in the shadow of the Almighty',
            'forever and ever.',
            'Amen.'
        ]
    }
];
