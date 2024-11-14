
export function getCallbackRoute(url: URL, baseAuthPath: string) {
  return url.origin + baseAuthPath + '/callback'
}

export function getProviderCallbackRoute() {

}

// export function getRedirectURI(context: Context, path: `/${ string }`) {

//   if ()

//   return context.currentUrl.origin + path

// }