export class ROUTES {
  // Base Routes
  static get base() {
    return `/` as const;
  }

  // Auth Routes
  static get login() {
    return `/auth/login` as const;
  }

  static get register() {
    return `/auth/register` as const;
  }

  static get logout() {
    return `/logout` as const;
  }
}
