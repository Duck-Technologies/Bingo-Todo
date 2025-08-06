import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  OnChanges,
  OnInit,
} from '@angular/core';
import {
  catchError,
  combineLatest,
  interval,
  map,
  Observable,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { calculateDateFromNow } from '../calculations/date-calculations';
import { AsyncPipe, DatePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-deadline-hourglass',
  imports: [AsyncPipe, MatIcon, MatTooltip, DatePipe],
  templateUrl: './deadline-hourglass.html',
  styleUrl: './deadline-hourglass.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeadlineHourglass {
  public readonly completionDate = input.required<Date | null>();
  public readonly deadlineDate = input.required<Date | null>();
  private readonly _deadlineDate = linkedSignal(() => this.deadlineDate());

  public readonly deadlineState$ = combineLatest([
    toObservable(this.completionDate),
    toObservable(this._deadlineDate),
  ]).pipe(
    map(([completionDate, deadlineDate]) => ({
      completionDate: completionDate,
      deadlineDate: deadlineDate,
      finished:
        !!completionDate ||
        (!!deadlineDate && new Date(deadlineDate) <= new Date()),
    })),
    switchMap((data) => {
      if (!data.deadlineDate) {
        return of('none' as const);
      }

      // don't start the interval if the deadline expired or the board was completed
      // or the deadline isn't within 80 minutes
      if (data.finished || new Date(data.deadlineDate) > calculateDateFromNow(80)) {
        return of(this.calculateState());
      }

      return interval(1 * 60000).pipe(
        startWith(this.calculateState()),
        map((_) => this.calculateState()),
        tap((state) => {
          if (state === 'failed') {
            this._deadlineDate.set(new Date(data.deadlineDate as Date));
          }
        })
      );
    })
  );

  private calculateState():
    | 'none'
    | 'finishedBefore'
    | 'finishedAfter'
    | 'failed'
    | 'expiresInAnHour'
    | 'pending' {
    let deadline = this.deadlineDate();

    if (!deadline) return 'none';

    deadline = new Date(deadline);
    const completionDate = this.completionDate();

    if (!!completionDate) {
      return new Date(completionDate) <= new Date(deadline)
        ? 'finishedBefore'
        : 'finishedAfter';
    }

    if (deadline <= new Date()) {
      return 'failed';
    }

    if (deadline <= calculateDateFromNow(60)) {
      return 'expiresInAnHour';
    }

    return 'pending';
  }
}
