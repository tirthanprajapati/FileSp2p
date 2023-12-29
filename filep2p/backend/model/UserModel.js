import mongooose from 'mongoose';
import bcrypt from 'bcryptjs';
const userSchema = mongooose.Schema({
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        require: true,
        unique: true
    },
    password:{
        type: String,
        require: true 
    }
},{
    timestamps: true
});


userSchema.pre('save' , async function (next){
    if(!this.isModified('password')){
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPasswords = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongooose.model('User',userSchema)

export default User;