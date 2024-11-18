import { auth } from "@/lib/auth";

const handler = auth.routeHandlers
export { handler as GET, handler as POST }