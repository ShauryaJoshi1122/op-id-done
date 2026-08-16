// ========================================
// EMAIL
// ========================================

export function isValidEmail(
    email
)
{
    const pattern =

        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return pattern.test(
        email
    );
}

// ========================================
// MOBILE
// ========================================

export function isValidMobile(
    mobile
)
{
    const pattern =

        /^[6-9]\d{9}$/;

    return pattern.test(
        mobile
    );
}

// ========================================
// PASSWORD
// ========================================
// MIN 8
// UPPER
// LOWER
// NUMBER
// SPECIAL
// ========================================

export function isStrongPassword(
    password
)
{
    const pattern =

        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    return pattern.test(
        password
    );
}

// ========================================
// PASSWORD MATCH
// ========================================

export function passwordsMatch(

    password,

    confirmPassword

)
{
    return (

        password ===
        confirmPassword

    );
}

// ========================================
// REQUIRED
// ========================================

export function isRequired(
    value
)
{
    return (

        value !== null &&

        value !== undefined &&

        String(value)
            .trim()
            .length > 0

    );
}

// ========================================
// NAME
// ========================================

export function isValidName(
    name
)
{
    return (

        name &&
        name.trim().length >= 3

    );
}

// ========================================
// FILE EXISTS
// ========================================

export function isValidFile(
    file
)
{
    return !!file;
}

// ========================================
// FILE SIZE
// ========================================

export function isValidFileSize(

    file,

    maxSize

)
{
    return (

        file.size <=
        maxSize

    );
}

// ========================================
// FILE TYPE
// ========================================

export function isValidFileType(

    file,

    allowedTypes

)
{
    return allowedTypes.includes(
        file.type
    );
}

// ========================================
// AGE
// ========================================

export function isAdult(
    dob
)
{
    const birthDate =

        new Date(
            dob
        );

    const today =
        new Date();

    let age =

        today.getFullYear()

        -

        birthDate.getFullYear();

    const monthDifference =

        today.getMonth()

        -

        birthDate.getMonth();

    if(

        monthDifference < 0 ||

        (

            monthDifference === 0 &&

            today.getDate()

            <

            birthDate.getDate()

        )

    )
    {
        age--;
    }

    return age >= 18;
}

// ========================================
// BLOOD GROUP
// ========================================

export function isValidBloodGroup(
    bloodGroup
)
{
    const groups = [

        "A+",
        "A-",

        "B+",
        "B-",

        "AB+",
        "AB-",

        "O+",
        "O-"

    ];

    return groups.includes(
        bloodGroup
    );
}

// ========================================
// URL
// ========================================

export function isValidUrl(
    url
)
{
    try
    {

        new URL(
            url
        );

        return true;

    }
    catch
    {

        return false;

    }
}

// ========================================
// YOUTUBE URL
// ========================================

export function isYoutubeUrl(
    url
)
{
    const pattern =

        /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//;

    return pattern.test(
        url
    );
}

// ========================================
// EMPTY FORM CHECK
// ========================================

export function validateRequiredFields(
    fields
)
{
    for(
        const field of fields
    )
    {
        if(
            !isRequired(
                field
            )
        )
        {
            return false;
        }
    }

    return true;
}

// ========================================
// GOVERNMENT PROOF
// ========================================

export function validateGovernmentProof(
    file
)
{
    if(
        !file
    )
    {
        return false;
    }

    const allowedTypes = [

        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf"

    ];

    const maxSize =

        10 *
        1024 *
        1024;

    return (

        isValidFileType(
            file,
            allowedTypes
        )

        &&

        isValidFileSize(
            file,
            maxSize
        )

    );
}

// ========================================
// DATE OF BIRTH NORMALIZATION & MATCHING
// ========================================

export function normalizeDobString(dobStr) {
    if (!dobStr) return "";
    const clean = String(dobStr).trim();
    // If format is YYYY-MM-DD
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(clean)) {
        const [y, m, d] = clean.split("-");
        return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
    }
    // If format is DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}$/.test(clean)) {
        const parts = clean.split(/[\/\-\.]/);
        return `${String(parts[0]).padStart(2, "0")}/${String(parts[1]).padStart(2, "0")}/${parts[2]}`;
    }
    // If parseable Date / Timestamp
    try {
        const dt = new Date(clean);
        if (!isNaN(dt.getTime())) {
            const dd = String(dt.getDate()).padStart(2, "0");
            const mm = String(dt.getMonth() + 1).padStart(2, "0");
            const yyyy = dt.getFullYear();
            return `${dd}/${mm}/${yyyy}`;
        }
    } catch (_) {}
    return clean.replace(/\D/g, "");
}

export function matchBirthDates(storedDob, inputDob) {
    if (!storedDob || !inputDob) return false;
    const n1 = normalizeDobString(storedDob);
    const n2 = normalizeDobString(inputDob);
    if (n1 && n2 && n1 === n2) return true;

    // Digits comparison
    const digits1 = String(storedDob).replace(/\D/g, "");
    const digits2 = String(inputDob).replace(/\D/g, "");
    if (digits1.length >= 6 && digits1 === digits2) return true;

    // Compare swapped ISO format YYYYMMDD vs DDMMYYYY
    if (digits1.length === 8 && digits2.length === 8) {
        const d1_iso = (digits1.startsWith("19") || digits1.startsWith("20")) ? digits1 : digits1.slice(4, 8) + digits1.slice(2, 4) + digits1.slice(0, 2);
        const d2_iso = (digits2.startsWith("19") || digits2.startsWith("20")) ? digits2 : digits2.slice(4, 8) + digits2.slice(2, 4) + digits2.slice(0, 2);
        if (d1_iso === d2_iso) return true;
    }

    return false;
}


export function validateMemberPhoto(
    file
)
{
    if(
        !file
    )
    {
        return false;
    }

    const allowedTypes = [

        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"

    ];

    const maxSize =

        5 *
        1024 *
        1024;

    return (

        isValidFileType(
            file,
            allowedTypes
        )

        &&

        isValidFileSize(
            file,
            maxSize
        )

    );
}