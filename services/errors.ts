export class service_error extends Error {
  status: number;
  errors: Array<{ message: string }>;
  constructor(status: number, message: string, errors?: Array<{ message: string }>) {
    super(message);
    this.status = status;
    this.errors = errors ?? [{ message }];
  }
}
