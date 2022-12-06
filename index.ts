interface User {
  name: string;
  age: number;
  roles: string[];
  createdAt: Date;
  isDeleted: boolean
}
interface IRequest {
  method: HTTPMethods;
  host: string;
  path: string;
  body?: User;
  params: {
    id?: string
  }
}
interface IObserver {
  next: HandleRequest;
  error: HandleError;
  complete: HandleComplete
}
interface Subscribe {
  unsubscribe(): void;
}
interface IError {
  status: number;
  message: string;
}

type HandleRequest = (request: IRequest) => { status: HTTPStatuses.HTTP_STATUS_OK };
type HandleError = (error: IError) => { status: HTTPStatuses.HTTP_STATUS_INTERNAL_SERVER_ERROR };
type HandleComplete = () => void;

enum HTTPStatuses {
  HTTP_STATUS_OK = 200,
  HTTP_STATUS_INTERNAL_SERVER_ERROR = 500
}
enum HTTPMethods {
  HTTP_POST_METHOD = 'POST',
  HTTP_GET_METHOD = 'GET'
}

class Observer {
  handlers: IObserver;
  isUnsubscribed: boolean;
  _unsubscribe: () => void;

  constructor(handlers) {
    this.handlers = handlers;
    this.isUnsubscribed = false;
  }

  next(value: IRequest): void {
    if (this.handlers.next && !this.isUnsubscribed) {
      this.handlers.next(value);
    }
  }

  error(error: IError): void {
    if (!this.isUnsubscribed) {
      if (this.handlers.error) {
        this.handlers.error(error);
      }

      this.unsubscribe();
    }
  }

  complete(): void {
    if (!this.isUnsubscribed) {
      if (this.handlers.complete) {
        this.handlers.complete();
      }

      this.unsubscribe();
    }
  }

  unsubscribe(): void {
    this.isUnsubscribed = true;

    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }
}

class Observable {
  _subscribe: (observer: Observer) => () => void;

  constructor(subscribe) {
    this._subscribe = subscribe;
  }

  static from(values: IRequest[]): Observable {
    return new Observable((observer: Observer) => {
      values.forEach((value) => observer.next(value));

      observer.complete();

      return () => {
        console.log('unsubscribed');
      };
    });
  }

  subscribe(obs: IObserver): Subscribe {
    const observer = new Observer(obs);

    observer._unsubscribe = this._subscribe(observer);

    return ({
      unsubscribe() {
        observer.unsubscribe();
      }
    });
  }
}

const userMock = {
  name: 'User Name',
  age: 26,
  roles: [
    'user',
    'admin'
  ],
  createdAt: new Date(),
  isDeleted: false,
};

const requestsMock = [
  {
    method: HTTPMethods.HTTP_POST_METHOD,
    host: 'service.example',
    path: 'user',
    body: userMock,
    params: {},
  },
  {
    method: HTTPMethods.HTTP_GET_METHOD,
    host: 'service.example',
    path: 'user',
    params: {
      id: '3f5h67s4s'
    },
  }
];

const handleRequest: HandleRequest = (request: IRequest) => {
  // handling of request
  return { status: HTTPStatuses.HTTP_STATUS_OK };
};
const handleError: HandleError = (error: IError) => {
  // handling of error
  return { status: HTTPStatuses.HTTP_STATUS_INTERNAL_SERVER_ERROR };
};

const handleComplete: HandleComplete = () => console.log('complete');

const requests$ = Observable.from(requestsMock);

const subscription = requests$.subscribe({
  next: handleRequest,
  error: handleError,
  complete: handleComplete
});

subscription.unsubscribe();