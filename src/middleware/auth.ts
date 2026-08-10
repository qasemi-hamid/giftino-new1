import { Request, Response, NextFunction } from "express";
import { adminAuth } from "../lib/firebase-admin.ts";

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // Fallback/support for demo users who aren't authenticated with Firebase
    const demoUid = req.headers["x-demo-user-uid"] as string;
    if (demoUid) {
      req.user = {
        uid: demoUid,
        email: req.headers["x-demo-user-email"] 
          ? decodeURIComponent(req.headers["x-demo-user-email"] as string) 
          : "demo@giftino.com",
        name: req.headers["x-demo-user-name"] 
          ? decodeURIComponent(req.headers["x-demo-user-name"] as string) 
          : "Demo User",
      };
      return next();
    }
    return res.status(401).json({ error: "Unauthorized: Missing authorization header" });
  }

  const token = authHeader.split("Bearer ")[1];
  
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email?.split("@")[0] || "User",
    };
    next();
  } catch (error) {
    // Fallback for custom dev tokens or demo bypass
    if (token.startsWith("demo-uid-")) {
      req.user = {
        uid: token,
        email: "demo@giftino.com",
        name: "Demo User",
      };
      return next();
    }
    console.error("Error verifying Firebase ID token:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
export default requireAuth;
