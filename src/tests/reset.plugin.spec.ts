import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Actions, provideStore, Store } from '@ngxs/store';
import {
  StateClear,
  StateOverwrite,
  StateReset,
  StateResetAll,
  withNgxsResetPlugin,
} from '../public_api';
import {
  AdminState,
  AppState,
  MissingState,
  PreferencesState,
  SessionState,
  ToDoState,
} from './test-states';
import {
  Admin,
  AdminSetSuperadmin,
  Preferences,
  PreferencesToggleDark,
  Session,
  SessionEnd,
  ToDoAdd,
} from './test-symbols';
import { AdminModule } from './test-lazy-module';

interface TestModel {
  actions$: Actions;
  store: Store;
  navigateToAdmin: () => Promise<void>;
}

describe('NgxsResetPlugin', () => {
  it('should clear states on StateClear', async () => {
    const { store } = await setupTest();

    store.dispatch(new StateClear());
    await settle();

    expect(store.snapshot()).toEqual({});
  });

  it('should clear states on StateClear but keep selected', async () => {
    const { store } = await setupTest();

    store.dispatch(new StateClear(PreferencesState));
    await settle();

    expect(store.snapshot()).toEqual({
      app: { preferences: { darkmode: false, language: 'en' } },
    });
  });

  it('should clear states on StateClear but keep selected (multi)', async () => {
    const { store } = await setupTest();

    const session = await ensureLastSeen(store);

    store.dispatch(new StateClear(PreferencesState, SessionState));
    await settle();

    expect(store.snapshot()).toEqual({
      app: { preferences: { darkmode: false, language: 'en' }, session },
    });
  });

  it('should ignore missing states on StateClear but keep the rest', async () => {
    const { store } = await setupTest();

    const session = await ensureLastSeen(store);

    store.dispatch(
      new StateClear(PreferencesState, MissingState, SessionState),
    );
    await settle();

    expect(store.snapshot()).toEqual({
      app: { preferences: { darkmode: false, language: 'en' }, session },
    });
  });

  it('should log a warning on StateClear with wrong payload', async () => {
    const { store } = await setupTest();

    console.warn = jasmine.createSpy('warning');

    store.dispatch(new StateClear(ToDoAdd));
    await settle();

    expect(console.warn).toHaveBeenCalled();
    expect(store.snapshot()).toEqual({});
  });

  it('should reset state to defaults on StateReset', async () => {
    const { store } = await setupTest();

    store.dispatch(new StateReset(AppState)); // should respect state tree
    await settle();

    expect(store.selectSnapshot(ToDoState.list)).toEqual([]);
  });

  it('should reset state to defaults on StateReset (multi)', async () => {
    const { store } = await setupTest();

    await ensureLastSeen(store);

    store.dispatch(new StateReset(SessionState, ToDoState));
    await settle();

    expect(store.selectSnapshot(SessionState.getState)).toEqual({});
    expect(store.selectSnapshot(ToDoState.list)).toEqual([]);
  });

  it('should ignore missing states on StateReset and reset the rest', async () => {
    const { store } = await setupTest();

    await ensureLastSeen(store);

    store.dispatch(new StateReset(SessionState, MissingState, ToDoState));
    await settle();

    expect(store.selectSnapshot(SessionState.getState)).toEqual({});
    expect(store.selectSnapshot(ToDoState.list)).toEqual([]);
  });

  it('should log a warning on StateReset with wrong payload', async () => {
    const { store } = await setupTest();
    const state = store.snapshot();

    console.warn = jasmine.createSpy('warning');

    store.dispatch(new StateReset(ToDoAdd));
    await settle();

    expect(console.warn).toHaveBeenCalled();
    expect(store.snapshot()).toEqual(state);
  });

  it('should reset state to defaults on StateResetAll', async () => {
    const { store } = await setupTest();

    const preferences = store.selectSnapshot(PreferencesState.getState);
    const session = store.selectSnapshot(SessionState.getState);

    await ensureDarkMode(store);
    await ensureLastSeen(store);

    store.dispatch(new StateResetAll());
    await settle();

    expect(store.selectSnapshot(PreferencesState.getState)).toEqual(
      preferences,
    );
    expect(store.selectSnapshot(SessionState.getState)).toEqual(session);
    expect(store.selectSnapshot(ToDoState.list)).toEqual([]);
  });

  it('should reset state to defaults on StateResetAll but keep given state', async () => {
    const { store } = await setupTest();

    const session = await ensureLastSeen(store);

    store.dispatch(new StateResetAll(SessionState));
    await settle();

    expect(store.selectSnapshot(SessionState.getState)).toEqual(session);
    expect(store.selectSnapshot(ToDoState.list)).toEqual([]);
  });

  it('should reset state to defaults on StateResetAll but keep given states (multi)', async () => {
    const { store } = await setupTest();

    const preferences = await ensureDarkMode(store);
    const session = await ensureLastSeen(store);

    store.dispatch(new StateResetAll(PreferencesState, SessionState));
    await settle();

    expect(store.selectSnapshot(PreferencesState.getState)).toEqual(
      preferences,
    );
    expect(store.selectSnapshot(SessionState.getState)).toEqual(session);
    expect(store.selectSnapshot(ToDoState.list)).toEqual([]);
  });

  it('should ignore missing states on StateResetAll and keep the rest', async () => {
    const { store } = await setupTest();

    const preferences = await ensureDarkMode(store);
    const session = await ensureLastSeen(store);

    store.dispatch(
      new StateResetAll(PreferencesState, MissingState, SessionState),
    );
    await settle();

    expect(store.selectSnapshot(PreferencesState.getState)).toEqual(
      preferences,
    );
    expect(store.selectSnapshot(SessionState.getState)).toEqual(session);
    expect(store.selectSnapshot(ToDoState.list)).toEqual([]);
  });

  it('should log a warning on StateResetAll with wrong payload', async () => {
    const { store } = await setupTest();
    const preferences = store.selectSnapshot(PreferencesState.getState);
    const session = store.selectSnapshot(SessionState.getState);

    console.warn = jasmine.createSpy('warning');

    await ensureDarkMode(store);
    await ensureLastSeen(store);

    store.dispatch(new StateResetAll(ToDoAdd));
    await settle();

    expect(console.warn).toHaveBeenCalled();
    expect(store.selectSnapshot(PreferencesState.getState)).toEqual(
      preferences,
    );
    expect(store.selectSnapshot(SessionState.getState)).toEqual(session);
    expect(store.selectSnapshot(ToDoState.list)).toEqual([]);
  });

  it('should overwrite state with given value on StateOverwrite', async () => {
    const { store } = await setupTest();

    store.dispatch(new StateOverwrite([ToDoState, { list: [] }]));
    await settle();

    expect(store.selectSnapshot(ToDoState.list)).toEqual([]);
  });

  it('should overwrite state with given value on StateOverwrite (multi)', async () => {
    const { store } = await setupTest();

    await ensureLastSeen(store);

    store.dispatch(
      new StateOverwrite([SessionState, null], [ToDoState, { list: [] }]),
    );
    await settle();

    expect(store.selectSnapshot(SessionState.getState)).toBeNull();
    expect(store.selectSnapshot(ToDoState.list)).toEqual([]);
  });

  it('should ignore missing states on StateOverwrite and overwrite the rest', async () => {
    const { store } = await setupTest();

    await ensureLastSeen(store);

    store.dispatch(
      new StateOverwrite(
        [SessionState, null],
        [MissingState, Math.E],
        [ToDoState, { list: [] }],
      ),
    );
    await settle();

    expect(store.selectSnapshot(SessionState.getState)).toBeNull();
    expect(store.selectSnapshot(ToDoState.list)).toEqual([]);
  });

  it('should log a warning on StateOverwrite with wrong payload', async () => {
    const { store } = await setupTest();
    const state = store.snapshot();

    console.warn = jasmine.createSpy('warning');

    store.dispatch(new StateOverwrite([ToDoAdd, true]));
    await settle();

    expect(console.warn).toHaveBeenCalled();
    expect(store.snapshot()).toEqual(state);
  });

  describe('with lazy module', () => {
    let testModule: TestModel;

    beforeEach(async () => {
      testModule = await setupTest();
      await testModule.navigateToAdmin();
    });

    it('should reset state to defaults on StateResetAll', async () => {
      const { store } = testModule;

      const adminState = store.selectSnapshot(AdminState.getState);
      await ensureSuperadminRole(store);

      store.dispatch(new StateResetAll());
      await settle();

      expect(store.selectSnapshot(AdminState.getState)).toEqual(adminState);
    });

    it('should reset state to defaults on StateResetAll but keep given state', async () => {
      const { store } = testModule;

      const adminState = await ensureSuperadminRole(store);

      store.dispatch(new StateResetAll(AdminState));
      await settle();

      expect(store.selectSnapshot(AdminState.getState)).toEqual(adminState);
      expect(store.selectSnapshot(ToDoState.list)).toEqual([]);
    });
  });
});

/**
 * Zoneless replacement for `tick()`: waits until Angular has no pending work.
 */
function settle(): Promise<void> {
  return TestBed.inject(ApplicationRef).whenStable();
}

async function ensureDarkMode(store: Store): Promise<Preferences.State> {
  const { darkmode } = store.selectSnapshot(PreferencesState.getState);

  store.dispatch(new PreferencesToggleDark());
  await settle();

  const preferences = store.selectSnapshot(PreferencesState.getState);
  expect(preferences.darkmode).toBe(!darkmode);

  return preferences;
}

async function ensureLastSeen(store: Store): Promise<Session.State> {
  const lastseen = new Date().valueOf();

  store.dispatch(new SessionEnd(lastseen));
  await settle();

  const session = store.selectSnapshot(SessionState.getState);
  expect(session).toEqual({ lastseen });

  return session;
}

async function ensureSuperadminRole(store: Store): Promise<Admin.State> {
  const role = store.selectSnapshot(AdminState.role);

  store.dispatch(new AdminSetSuperadmin());
  await settle();

  const adminState = store.selectSnapshot(AdminState.getState);
  expect(adminState.role).not.toBe(role);

  return adminState;
}

async function setupTest(): Promise<TestModel> {
  TestBed.configureTestingModule({
    providers: [
      provideStore([AppState, PreferencesState, SessionState, ToDoState]),
      withNgxsResetPlugin(),
      provideRouter([
        {
          path: 'admin',
          loadChildren: () => AdminModule,
        },
      ]),
    ],
  });

  const router = TestBed.inject(Router);
  const actions$ = TestBed.inject(Actions);
  const store = TestBed.inject(Store);

  async function navigateToAdmin() {
    await router.navigateByUrl('/admin');
    await settle();
  }

  store.dispatch(new ToDoAdd('Test'));

  await settle();
  expect(store.selectSnapshot(ToDoState.list)).toEqual([
    { description: 'Test', done: false },
  ]);

  return { actions$, store, navigateToAdmin };
}
