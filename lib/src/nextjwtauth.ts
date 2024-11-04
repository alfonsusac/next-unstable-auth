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

  return {
    ...serverFunctions,
    routeHandler,
    config,
    $Infer: {
      Providers: undefined as unknown as P,
      JWT: undefined as unknown as J,
      Session: undefined as unknown as S,
      Config: undefined as unknown as Config<P, J, S>,
    }
  }

}

/**
 * Todo List:
 * - [ ] Validate credentials or allow credential to be validated.
 */