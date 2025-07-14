const {z}= require('zod');

const BlogSchema = z.object({
  title: z.string().min(1, "Title is required").max(150, "Title too long"),
  content: z.string().min(1, "Content is required"),
imageUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

module.exports={
    BlogSchema
}