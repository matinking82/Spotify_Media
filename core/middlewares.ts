import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import { validateToken } from "./ApiServices";

export const protect = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    const bearer = req.headers.authorization;

    if (!bearer) {
        res.status(401);
        res.json({ message: "Not Authorized" });
        return;
    }

    const [, token] = bearer.split(" ");
    if (!token) {
        res.status(401);
        res.json({ message: "Not Authorized" });
        return;
    }

    try {
        const result = await validateToken(token);

        if (!result.success) {
            res.status(401);
            res.json({ message: result.message });
            return;
        }

        const user = result.data;

        if (!user) {
            res.status(401);
            res.json({ message: "Not valid token" });
            return;
        }

        req.user = {
            id: user.id,
        };
    } catch (e) {
        res.status(401);
        res.json({ message: "Not valid token" });
        return;
    }

    next();
};