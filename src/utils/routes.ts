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

  // Workflow Routes
  static get workflows() {
    return `/workflows` as const;
  }

  static get workflowList() {
    return `/workflows/list` as const;
  }

  static get workflowCreate() {
    return `/workflows/create` as const;
  }

  static get workflowEdit() {
    return `/workflows/edit/:id` as const;
  }

  static get workflowDetail() {
    return `/workflows/detail/:id` as const;
  }
}
