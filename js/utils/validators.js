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
// MEMBER PHOTO
// ========================================

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