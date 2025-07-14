const {z}= require('zod');

const CommentSchema = z.object({
  blogId: z.string().refine((val) => val.length === 24, {
    message: "Invalid Blog ID",
  }),
  text: z.string().min(1, "Comment text is required"),
});


module.exports ={
    CommentSchema
}