import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

@Component({
  selector: 'app-progress-circle',
  imports: [],
  templateUrl: './progress-circle.html',
  styleUrl: './progress-circle.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressCircle {
  public readonly total = input.required<number>();
  public readonly green = input<number>(0);
  public readonly blue = input<number>(0);
  public readonly yellow = input<number>(0);
  public readonly safeTotal = computed(() => this.total() ?? 1);
}
