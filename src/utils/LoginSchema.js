const z= require("zod");

const LoginSchema = z.object({
    emailId: z.string().email("Invalid email address"),
});

module.exports = {
    LoginSchema
}