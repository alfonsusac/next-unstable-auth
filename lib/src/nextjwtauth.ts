import { Config, GetDefaultJ } from "./config";
import { Providers } from "./providers";
import { init } from "./init";
import { getServerFunction } from "./api/server-functions";
import { getNextHandlerFunctions } from "./api/handler/handler";


export function NextJWTAuth<
  P extends Providers = any,
  J = GetDefaultJ<P>,
  S = J,
>(config: Config<P, J, S>) {

  const $ = init(config)
  const serverFunctions = getServerFunction($)
  const routeHandler = getNextHandlerFunctions($)

}
