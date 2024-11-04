import { auth } from "@/lib/auth";

const handler = auth.routeHandler
export { handler as GET, handler as POST }