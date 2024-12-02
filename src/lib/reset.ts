import { makeEnvironmentProviders } from '@angular/core';
import { withNgxsPlugin } from '@ngxs/store';
import { ResetHandler } from './reset.handler';
import { NgxsResetPlugin } from './reset.plugin';
import { ResetService } from './reset.service';

export function withNgxsResetPlugin() {
  return makeEnvironmentProviders([
    withNgxsPlugin(NgxsResetPlugin),
    ResetService,
    ResetHandler,
  ]);
}
