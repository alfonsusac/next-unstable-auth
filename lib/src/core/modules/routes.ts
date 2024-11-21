

// export class Routes {

//   private routes: { -readonly [key in keyof typeof routes]: Route }
//   constructor(
//     readonly baseURL: `${ string }://${ string }`,
//     readonly basePath: string,
//   ) {
//     this.routes = Object.entries(routes).reduce(
//       (prev, curr) => {
//         const [key, value] = curr as [keyof typeof routes, string]
//         prev[key] = new Route(value.split(' ')[0], `${ baseURL }${ basePath }${ value.split(' ')[1] }`)
//         return prev
//       },
//       {} as { -readonly [key in keyof typeof routes]: Route },
//     )
//   }
//   getURL(route: keyof typeof routes) {
//     return this.routes[route].url
//   }
//   getMethod(route: keyof typeof routes) {
//     return this.routes[route].method
//   }
//   get(route: keyof typeof routes) {
//     return [this.routes[route].method, this.routes[route].url] as const
//   }
// }