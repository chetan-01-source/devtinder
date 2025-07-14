const z= require("zod");

const SignUpSchema = z.object({
    emailId: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    firstName: z.string().min(1, "Name is required"),
    lastName: z.string().min(1, "Name is required"),
    age: z.number().int().positive("Age must be a positive integer").optional(),
    gender :z.enum(['male', 'female', 'other']),
    skills: z.array(z.string()).optional(),
    about: z.string().max(500, "About section cannot exceed 500 characters").optional(),
    photoUrl: z.string().url("Invalid URL format").optional(),
phoneNumber: z.string().regex(/^\d{10}$/, {
    message: "Phone number must be exactly 10 digits",
  }),
})

module.exports = {
    SignUpSchema
}