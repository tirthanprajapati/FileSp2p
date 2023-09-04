import asyncHandler from 'express-async-handler';


// description: Auth User/Set Token
// route: POST /api/users/auth
// @access Public

const authUser = asyncHandler(async(req,res) => {
    res.status(200).json( { message: 'Auth User' } )
});


// description: Register new user
// route: POST /api/users
// @access Public

const RegisterUser = asyncHandler(async(req,res) => {
    res.status(200).json( { message: 'Register User' } )
});

// description: Logout User
// route: POST /api/users/logout
// @access Public

const LogoutUser = asyncHandler(async(req,res) => {
    res.status(200).json( { message: 'Logout User' } )
});

// description: Get user profile
// route: GET /api/users/porfile
// @access Private

const getUserProfile = asyncHandler(async(req,res) => {
    res.status(200).json( { message: 'User profile' } )
});

// description: Update User Profile
// route: PUT /api/users/auth
// @access Public

const updateUserProfile = asyncHandler(async(req,res) => {
    res.status(200).json( { message: 'Update User profile' } )
});




export { 
    authUser,
    RegisterUser,
    LogoutUser,
    getUserProfile,
    updateUserProfile
}