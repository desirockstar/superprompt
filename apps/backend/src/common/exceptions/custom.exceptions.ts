import { HttpException, HttpStatus } from '@nestjs/common';

export class PromptNotFoundException extends HttpException {
  constructor(slug: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Prompt with slug "${slug}" not found`,
        error: 'PROMPT_NOT_FOUND',
      },
      HttpStatus.NOT_FOUND,
    );
    this.name = 'PromptNotFoundException';
  }
}

export class CategoryNotFoundException extends HttpException {
  constructor(categoryId: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Category with id "${categoryId}" not found`,
        error: 'CATEGORY_NOT_FOUND',
      },
      HttpStatus.NOT_FOUND,
    );
    this.name = 'CategoryNotFoundException';
  }
}

export class InsufficientPermissionException extends HttpException {
  constructor(message = 'You do not have permission to perform this action') {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        message,
        error: 'INSUFFICIENT_PERMISSION',
      },
      HttpStatus.FORBIDDEN,
    );
    this.name = 'InsufficientPermissionException';
  }
}

export class PaymentRequiredException extends HttpException {
  constructor(message = 'Subscription required to access this resource') {
    super(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        message,
        error: 'PAYMENT_REQUIRED',
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
    this.name = 'PaymentRequiredException';
  }
}

export class InvalidCredentialsException extends HttpException {
  constructor(message = 'Invalid email or password') {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        message,
        error: 'INVALID_CREDENTIALS',
      },
      HttpStatus.UNAUTHORIZED,
    );
    this.name = 'InvalidCredentialsException';
  }
}

export class UserAlreadyExistsException extends HttpException {
  constructor(email: string) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message: `User with email "${email}" already exists`,
        error: 'USER_ALREADY_EXISTS',
      },
      HttpStatus.CONFLICT,
    );
    this.name = 'UserAlreadyExistsException';
  }
}

export class SubscriptionRequiredException extends HttpException {
  constructor(message = 'Active subscription required') {
    super(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        message,
        error: 'SUBSCRIPTION_REQUIRED',
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
    this.name = 'SubscriptionRequiredException';
  }
}

export class UnlockAlreadyExistsException extends HttpException {
  constructor(slug: string) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message: `Prompt "${slug}" is already unlocked for this user`,
        error: 'ALREADY_UNLOCKED',
      },
      HttpStatus.CONFLICT,
    );
    this.name = 'UnlockAlreadyExistsException';
  }
}

export class RateLimitExceededException extends HttpException {
  constructor(message = 'Too many requests, please try again later') {
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message,
        error: 'RATE_LIMIT_EXCEEDED',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
    this.name = 'RateLimitExceededException';
  }
}

export class InvalidStripeSignatureException extends HttpException {
  constructor(message = 'Invalid Stripe webhook signature') {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: 'INVALID_STRIPE_SIGNATURE',
      },
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InvalidStripeSignatureException';
  }
}