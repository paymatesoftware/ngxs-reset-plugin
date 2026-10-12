import { inject, Injectable } from '@angular/core';
import { Actions, InitState, ofActionSuccessful, Store, UpdateState } from '@ngxs/store';
import { take } from 'rxjs/operators';
import { ResetService } from './reset.service';

@Injectable()
export class ResetHandler {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly resetService = inject(ResetService);

  constructor() {
    // NGXS dispatches `InitState` synchronously from its root initializer, which
    // may already have run by the time this handler is created, so capture the
    // current snapshot first and let `InitState` refine it if it comes later.
    this.resetService.initialState = this.store.snapshot();

    this.actions$
      .pipe(
        ofActionSuccessful(InitState),
        take(1),
      )
      .subscribe(() => (this.resetService.initialState = this.store.snapshot()));

    this.actions$.pipe(ofActionSuccessful(UpdateState)).subscribe(
      ({ addedStates }) =>
        (this.resetService.initialState = {
          ...this.resetService.initialState,
          ...addedStates,
        }),
    );
  }
}
