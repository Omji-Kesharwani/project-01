import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { verify } from 'hono/jwt'
export const blogRouter=new Hono<{
  Bindings: {
		DATABASE_URL: string,
		JWT_SECRET: string,
	},
  Variables:{
    userId:string;
  }
}>();
blogRouter.use('/*', async (c, next) => {
	const jwt = c.req.header('Authorization');
	if (!jwt) {
		c.status(401);
		return c.json({ error: "unauthorized" });
	}
	const token = jwt.split(' ')[1];
	const payload = await verify(token, c.env.JWT_SECRET);
	if (!payload) {
		c.status(401);
		return c.json({ error: "unauthorized" });
	}
  //@ts-ignore
	c.set('userId', payload.id);
	await next()
})
 
blogRouter.post('/',async(c)=>{
  	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());

	const body = await c.req.json();
  const userId=c.get("userId");
  const blog=await prisma.post.create({
    data:{
      title:body.title,
      content:body.content,
      published:body.published,
      authorId:userId
    }
  })
  return c.json({
    id:blog.id,
  })
})
blogRouter.put('/',async(c)=>{
  const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());

	const body = await c.req.json();
  const blog=await prisma.post.update({
    where:{
      id:body.id,
    },
    data:{
      content:body.content,
      title:body.title
    }
  })
  return c.json({
    id:blog.id,
  })

})
blogRouter.get('/',async(c)=>{
  const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());

	const body = await c.req.json();
 try{
  const blog=await prisma.post.findFirst({
    where:{
      id:body.id,
    }
  })
  return c.json({
   blog
  })
 }
 catch(e){
  c.status(403);
  return c.json({
  msg:"Error while fetching the blog post",
  })
 }
})
blogRouter.get('/bulk',async(c)=>{
  const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());


  const blogs= await prisma.post.findMany();
  return c.json({
    blogs,
  })
})