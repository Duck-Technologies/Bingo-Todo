import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import {
  interval,
  startWith,
  map,
  combineLatest,
  tap,
  Subscription,
  Observable,
  of,
} from 'rxjs';
import {
  boardForm,
  NotOnlyWhiteSpacePattern,
} from '../board-details-form/form';
import { AsyncPipe, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { calculateDateFromNow } from '../calculations/date-calculations';
import { provideNativeDateAdapter } from '@angular/material/core';
import { DATE_FORMATS } from '../../app.config';

@Component({
  selector: 'app-deadline-reward-form',
  imports: [
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatTimepickerModule,
    DatePipe,
    AsyncPipe,
    MatIcon,
    MatIconButton,
    MatButton,
    MatTooltip,
  ],
  providers: [provideNativeDateAdapter(DATE_FORMATS)],
  templateUrl: './deadline-reward-form.html',
  styleUrl: './deadline-reward-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'form',
    'aria-label': 'Inputs for setting the deadline and rewards',
  },
})
export class DeadlineRewardForm implements OnInit, OnDestroy {
  public readonly createMode = input.required<boolean>();
  public readonly gameMode = input.required<'todo' | 'traditional'>();

  private static readonly minDateMinutesFromNow = 15;

  private readonly boardForm = boardForm;

  public readonly canOnlyRemove$ = computed(() =>
    this.createMode()
      ? of(false)
      : this.gameModeForm().controls.CompletionDateUtc.valueChanges.pipe(
          startWith(this.gameModeForm().getRawValue().CompletionDateUtc),
          map((d) => !!d)
        )
  );

  public readonly completionRewardHint$ = computed(() =>
    this.gameModeForm().controls.CompletionReward.valueChanges.pipe(
      map((reward) =>
        reward?.length && reward?.match(NotOnlyWhiteSpacePattern)?.length
          ? `You've earned ${reward}`
          : null
      )
    )
  );
  
  public readonly deadlineInputsDisplay = signal<'none' | 'display'>('none');

  public readonly gameModeForm = computed(() =>
    this.gameMode() === 'traditional'
      ? this.boardForm.controls.TraditionalGame
      : this.boardForm.controls.TodoGame
  );

  // min date's time if today, else no min time
  public readonly minTime$ = computed(() =>
    this.gameModeForm().controls.CompletionDeadlineUtc.valueChanges.pipe(
      map((deadline) => {
        if (deadline) {
          deadline = new Date(deadline);

          if (deadline.getDay() === new Date().getDay()) {
            return DeadlineRewardForm.calculateMinDate();
          }
        }

        return null;
      })
    )
  );

  public minDate$: Observable<Date> | undefined;
  private minDateSubscription: Subscription | undefined;

  ngOnInit(): void {
    if (this.createMode()) {
      this.showDeadlineInputs();
    }
  }

  ngOnDestroy(): void {
    this.minDateSubscription?.unsubscribe();
  }

  public commitDeadline(cancel: boolean = false) {
    this.minDateSubscription?.unsubscribe();

    if (cancel) {
      this.gameModeForm().controls.CompletionDeadlineUtc.setValue(null);
    }

    this.deadlineInputsDisplay.set('none');
    this.boardForm.enable();
  }

  public showDeadlineInputs() {
    if (!this.createMode()) {
      this.boardForm.disable();
      this.gameModeForm().controls.CompletionDeadlineUtc.enable();
    }

    this.minDate$ = interval(5 * 60000).pipe(
      startWith(DeadlineRewardForm.calculateMinDate()),
      map((_) => DeadlineRewardForm.calculateMinDate())
    );

    this.minDateSubscription = combineLatest([
      this.minDate$,
      this.gameModeForm().controls.CompletionDeadlineUtc.valueChanges,
    ])
      .pipe(
        tap(([_, currentDate]) => {
          if (!!currentDate) {
            const date = new Date(currentDate);
            const minDate = DeadlineRewardForm.calculateMinDate();

            // set the deadline to minDate if it's less than it
            if (date < minDate) {
              this.gameModeForm().controls.CompletionDeadlineUtc.setValue(
                minDate
              );
            }
          }
        })
      )
      .subscribe();

    this.deadlineInputsDisplay.set('display');
  }

  public setTime(date: Date | null) {
    if (date?.toString() === 'Invalid Date') {
      return;
    }

    if (date) {
      this.gameModeForm().controls.CompletionDeadlineUtc.setValue(date);
      return;
    }

    // if the user erased the time, fall back to midnight of the selected date
    let currentDate = this.gameModeForm().getRawValue().CompletionDeadlineUtc;

    if (!!currentDate) {
      currentDate = new Date(currentDate);
      currentDate.setHours(0, 0, 0, 0);
      this.gameModeForm().controls.CompletionDeadlineUtc.setValue(currentDate);
    }
  }

  private static calculateMinDate() {
    return calculateDateFromNow(DeadlineRewardForm.minDateMinutesFromNow);
  }
}
