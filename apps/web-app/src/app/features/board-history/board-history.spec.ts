import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardHistory, EventType } from './board-history';
import { provideZonelessChangeDetection } from '@angular/core';
import { BoardInfo } from '../board/board';

describe('BoardHistory', () => {
  let component: BoardHistory;
  let fixture: ComponentFixture<BoardHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardHistory],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardHistory);
    fixture.componentRef.setInput('board', new BoardInfo());
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('case: create traditional, complete, continue, complete', () => {
    fixture.componentRef.setInput(
      'board',
      new BoardInfo({
        Name: null,
        GameMode: 'todo',
        CreatedAtUtc: new Date('2025-08-19T20:59:53.766Z'),
        CreatedBy: 'local user',
        LastChangedAtUtc: new Date('2025-08-19T21:00:14.703Z'),
        Cells: [
          {
            Name: 0,
            CheckedDateUTC: new Date('2025-08-19T21:00:07.525Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 1,
            Column: 1,
          },
          {
            Name: 1,
            CheckedDateUTC: new Date('2025-08-19T21:00:07.525Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 1,
            Column: 2,
          },
          {
            Name: 2,
            CheckedDateUTC: new Date('2025-08-19T21:00:07.525Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 1,
            Column: 3,
          },
          {
            Name: 3,
            CheckedDateUTC: new Date('2025-08-19T21:00:14.703Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 2,
            Column: 1,
          },
          {
            Name: 4,
            CheckedDateUTC: new Date('2025-08-19T21:00:14.703Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 2,
            Column: 2,
          },
          {
            Name: 5,
            CheckedDateUTC: new Date('2025-08-19T21:00:14.703Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 2,
            Column: 3,
          },
          {
            Name: 6,
            CheckedDateUTC: new Date('2025-08-19T21:00:14.703Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 3,
            Column: 1,
          },
          {
            Name: 7,
            CheckedDateUTC: new Date('2025-08-19T21:00:14.703Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 3,
            Column: 2,
          },
          {
            Name: 8,
            CheckedDateUTC: new Date('2025-08-19T21:00:14.703Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 3,
            Column: 3,
          },
        ],
        Visibility: 'local',
        SwitchedToTodoAfterCompleteDateUtc: new Date(
          '2025-08-19T21:00:10.958Z'
        ),
        TraditionalGame: {
          CompletedAtUtc: new Date('2025-08-19T21:00:07.525Z'),
          CompletionReward: null,
          CompletionDeadlineUtc: null,
          CompletedByGameModeSwitch: false,
        },
        TodoGame: {
          CompletedAtUtc: new Date('2025-08-19T21:00:14.703Z'),
          CompletionReward: null,
          CompletionDeadlineUtc: null,
        },
      })
    );

    expect(JSON.stringify(component.history())).toEqual(
      JSON.stringify([
        {
          date: '2025-08-19T21:00:14.703Z',
          events: [
            {
              label: 'Completed the game',
              date: '2025-08-19T21:00:14.703Z',
              type: EventType.GameModeCompletion,
              props: {
                gameMode: 'todo',
                reward: null,
                deadline: null,
                beforeDeadline: null,
              },
            },
            {
              label: 3,
              date: '2025-08-19T21:00:14.703Z',
              type: EventType.CellCheck,
            },
            {
              label: 4,
              date: '2025-08-19T21:00:14.703Z',
              type: EventType.CellCheck,
            },
            {
              label: 5,
              date: '2025-08-19T21:00:14.703Z',
              type: EventType.CellCheck,
            },
            {
              label: 6,
              date: '2025-08-19T21:00:14.703Z',
              type: EventType.CellCheck,
            },
            {
              label: 7,
              date: '2025-08-19T21:00:14.703Z',
              type: EventType.CellCheck,
            },
            {
              label: 8,
              date: '2025-08-19T21:00:14.703Z',
              type: EventType.CellCheck,
            },
          ],
          icon: 'trophy',
          progress: {
            green: 9,
            yellow: 9,
          },
          mainEventType: EventType.GameModeCompletion,
        },
        {
          date: '2025-08-19T21:00:10.958Z',
          events: [
            {
              label: 'Set game mode to TO-DO',
              date: '2025-08-19T21:00:10.958Z',
              type: EventType.GameModeChange,
            },
          ],
          icon: 'app_registration',
          progress: {
            green: 0,
            yellow: 0,
          },
          mainEventType: EventType.GameModeChange,
        },
        {
          date: '2025-08-19T21:00:07.525Z',
          events: [
            {
              label: 'Completed the game',
              date: '2025-08-19T21:00:07.525Z',
              type: EventType.GameModeCompletion,
              props: {
                gameMode: 'traditional',
                reward: null,
                deadline: null,
                beforeDeadline: null,
              },
            },
            {
              label: 0,
              date: '2025-08-19T21:00:07.525Z',
              type: EventType.CellCheck,
            },
            {
              label: 1,
              date: '2025-08-19T21:00:07.525Z',
              type: EventType.CellCheck,
            },
            {
              label: 2,
              date: '2025-08-19T21:00:07.525Z',
              type: EventType.CellCheck,
            },
          ],
          icon: 'trophy',
          progress: {
            green: 3,
            yellow: 3,
          },
          mainEventType: EventType.GameModeCompletion,
        },
        {
          date: '2025-08-19T20:59:53.766Z',
          events: [
            {
              label: 'Created board',
              date: '2025-08-19T20:59:53.766Z',
              type: EventType.Creation,
            },
          ],
          icon: 'app_registration',
          progress: {
            green: 0,
            yellow: 0,
          },
          mainEventType: EventType.Creation,
        },
      ])
    );
  });

  it('case: create todo, first strike, check, halfway, check, complete', () => {
    fixture.componentRef.setInput(
      'board',
      new BoardInfo({
        Name: null,
        GameMode: 'todo',
        CreatedAtUtc: new Date('2025-08-19T21:15:52.218Z'),
        CreatedBy: 'local user',
        LastChangedAtUtc: new Date('2025-08-19T21:16:48.391Z'),
        Cells: [
          {
            Name: 0,
            CheckedDateUTC: new Date('2025-08-19T21:15:56.162Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 1,
            Column: 1,
          },
          {
            Name: 1,
            CheckedDateUTC: new Date('2025-08-19T21:15:56.162Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 1,
            Column: 2,
          },
          {
            Name: 2,
            CheckedDateUTC: new Date('2025-08-19T21:15:56.162Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 1,
            Column: 3,
          },
          {
            Name: 3,
            CheckedDateUTC: new Date('2025-08-19T21:16:22.876Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 2,
            Column: 1,
          },
          {
            Name: 4,
            CheckedDateUTC: new Date('2025-08-19T21:16:28.919Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 2,
            Column: 2,
          },
          {
            Name: 5,
            CheckedDateUTC: new Date('2025-08-19T21:16:33.930Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 2,
            Column: 3,
          },
          {
            Name: 6,
            CheckedDateUTC: new Date('2025-08-19T21:16:33.930Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 3,
            Column: 1,
          },
          {
            Name: 7,
            CheckedDateUTC: new Date('2025-08-19T21:16:48.391Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 3,
            Column: 2,
          },
          {
            Name: 8,
            CheckedDateUTC: new Date('2025-08-19T21:16:48.391Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 3,
            Column: 3,
          },
        ],
        Visibility: 'local',
        TraditionalGame: {
          CompletedAtUtc: null,
          CompletionReward: null,
          CompletionDeadlineUtc: null,
        },
        TodoGame: {
          CompletedAtUtc: new Date('2025-08-19T21:16:48.391Z'),
          CompletionReward: 'reward',
          CompletionDeadlineUtc: null,
        },
      })
    );

    expect(JSON.stringify(component.history())).toEqual(
      JSON.stringify([
        {
          date: '2025-08-19T21:16:48.391Z',
          events: [
            {
              label: 'Completed the game',
              date: '2025-08-19T21:16:48.391Z',
              type: EventType.GameModeCompletion,
              props: {
                gameMode: 'todo',
                reward: 'reward',
                deadline: null,
                beforeDeadline: null,
              },
            },
            {
              label: 7,
              date: '2025-08-19T21:16:48.391Z',
              type: EventType.CellCheck,
            },
            {
              label: 8,
              date: '2025-08-19T21:16:48.391Z',
              type: EventType.CellCheck,
            },
          ],
          icon: 'trophy',
          progress: {
            green: 9,
            yellow: 9,
          },
          mainEventType: EventType.GameModeCompletion,
        },
        {
          date: '2025-08-19T21:16:33.930Z',
          events: [
            {
              date: '2025-08-19T21:16:33.930Z',
              label: 'Checked 7/9',
              type: EventType.Progress,
            },
            {
              label: 5,
              date: '2025-08-19T21:16:33.930Z',
              type: EventType.CellCheck,
            },
            {
              label: 6,
              date: '2025-08-19T21:16:33.930Z',
              type: EventType.CellCheck,
            },
          ],
          mainEventType: EventType.Progress,
          icon: 'progressBar',
          progress: {
            green: 7,
            yellow: 7,
          },
        },
        {
          date: '2025-08-19T21:16:28.919Z',
          events: [
            {
              label: 'Over halfway done',
              date: '2025-08-19T21:16:28.919Z',
              type: EventType.Halfway,
            },
            {
              label: 4,
              date: '2025-08-19T21:16:28.919Z',
              type: EventType.CellCheck,
            },
          ],
          icon: 'star_half',
          progress: {
            green: 3,
            yellow: 5,
          },
          mainEventType: EventType.Halfway,
        },
        {
          date: '2025-08-19T21:16:22.876Z',
          events: [
            {
              date: '2025-08-19T21:16:22.876Z',
              label: 'Checked 4/9',
              type: EventType.Progress,
            },
            {
              label: 3,
              date: '2025-08-19T21:16:22.876Z',
              type: EventType.CellCheck,
            },
          ],
          mainEventType: EventType.Progress,
          icon: 'progressBar',
          progress: {
            green: 3,
            yellow: 4,
          },
        },
        {
          date: '2025-08-19T21:15:56.162Z',
          events: [
            {
              label: 'BINGO! First strike',
              date: '2025-08-19T21:15:56.162Z',
              type: EventType.FirstStrike,
            },
            {
              label: 0,
              date: '2025-08-19T21:15:56.162Z',
              type: EventType.CellCheck,
            },
            {
              label: 1,
              date: '2025-08-19T21:15:56.162Z',
              type: EventType.CellCheck,
            },
            {
              label: 2,
              date: '2025-08-19T21:15:56.162Z',
              type: EventType.CellCheck,
            },
          ],
          icon: 'firstStrike',
          progress: {
            green: 3,
            yellow: 3,
          },
          mainEventType: EventType.FirstStrike,
        },
        {
          date: '2025-08-19T21:15:52.218Z',
          events: [
            {
              label: 'Created board',
              date: '2025-08-19T21:15:52.218Z',
              type: EventType.Creation,
            },
          ],
          icon: 'app_registration',
          progress: {
            green: 0,
            yellow: 0,
          },
          mainEventType: EventType.Creation,
        },
      ])
    );
  });

  it('case: create todo, first strike, check, changed to traditional + complete, changed to TO-DO, halfway, check, complete', () => {
    // this tests that deadline expired entries are not added if they are after the completion dates
    fixture.componentRef.setInput(
      'board',
      new BoardInfo({
        Name: null,
        GameMode: 'todo',
        CreatedAtUtc: new Date('2025-08-19T21:27:37.066Z'),
        CreatedBy: 'local user',
        LastChangedAtUtc: new Date('2025-08-19T21:28:16.663Z'),
        Cells: [
          {
            Name: 0,
            CheckedDateUTC: new Date('2025-08-19T21:27:43.539Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 1,
            Column: 1,
          },
          {
            Name: 1,
            CheckedDateUTC: new Date('2025-08-19T21:27:43.539Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 1,
            Column: 2,
          },
          {
            Name: 2,
            CheckedDateUTC: new Date('2025-08-19T21:27:43.539Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 1,
            Column: 3,
          },
          {
            Name: 3,
            CheckedDateUTC: new Date('2025-08-19T21:27:46.427Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 2,
            Column: 1,
          },
          {
            Name: 4,
            CheckedDateUTC: new Date('2025-08-19T21:28:10.999Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 2,
            Column: 2,
          },
          {
            Name: 5,
            CheckedDateUTC: new Date('2025-08-19T21:28:13.172Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 2,
            Column: 3,
          },
          {
            Name: 6,
            CheckedDateUTC: new Date('2025-08-19T21:28:13.172Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 3,
            Column: 1,
          },
          {
            Name: 7,
            CheckedDateUTC: new Date('2025-08-19T21:28:16.663Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 3,
            Column: 2,
          },
          {
            Name: 8,
            CheckedDateUTC: new Date('2025-08-19T21:28:16.663Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 3,
            Column: 3,
          },
        ],
        Visibility: 'local',
        SwitchedToTodoAfterCompleteDateUtc: new Date(
          '2025-08-19T21:28:03.778Z'
        ),
        TraditionalGame: {
          CompletedAtUtc: new Date('2025-08-19T21:27:55.596Z'),
          CompletionReward: 'traditional reward',
          CompletionDeadlineUtc: new Date('2025-08-22T21:00:00.000Z'),
          CompletedByGameModeSwitch: true,
        },
        TodoGame: {
          CompletedAtUtc: new Date('2025-08-19T21:28:16.663Z'),
          CompletionReward: 'todo reward',
          CompletionDeadlineUtc: new Date('2025-08-22T21:00:00.000Z'),
        },
      })
    );

    expect(JSON.stringify(component.history())).toEqual(
      JSON.stringify([
        {
          date: '2025-08-19T21:28:16.663Z',
          events: [
            {
              label: 'Completed the game',
              date: '2025-08-19T21:28:16.663Z',
              type: EventType.GameModeCompletion,
              props: {
                gameMode: 'todo',
                reward: 'todo reward',
                deadline: '2025-08-22T21:00:00.000Z',
                beforeDeadline: true,
              },
            },
            {
              label: 7,
              date: '2025-08-19T21:28:16.663Z',
              type: EventType.CellCheck,
            },
            {
              label: 8,
              date: '2025-08-19T21:28:16.663Z',
              type: EventType.CellCheck,
            },
          ],
          icon: 'trophy',
          progress: {
            green: 9,
            yellow: 9,
          },
          mainEventType: EventType.GameModeCompletion,
        },
        {
          date: '2025-08-19T21:28:13.172Z',
          events: [
            {
              date: '2025-08-19T21:28:13.172Z',
              label: 'Checked 7/9',
              type: EventType.Progress,
            },
            {
              label: 5,
              date: '2025-08-19T21:28:13.172Z',
              type: EventType.CellCheck,
            },
            {
              label: 6,
              date: '2025-08-19T21:28:13.172Z',
              type: EventType.CellCheck,
            },
          ],
          mainEventType: EventType.Progress,
          icon: 'progressBar',
          progress: {
            green: 7,
            yellow: 7,
          },
        },
        {
          date: '2025-08-19T21:28:10.999Z',
          events: [
            {
              label: 'Over halfway done',
              date: '2025-08-19T21:28:10.999Z',
              type: EventType.Halfway,
            },
            {
              label: 4,
              date: '2025-08-19T21:28:10.999Z',
              type: EventType.CellCheck,
            },
          ],
          icon: 'star_half',
          progress: {
            green: 3,
            yellow: 5,
          },
          mainEventType: EventType.Halfway,
        },
        {
          date: '2025-08-19T21:28:03.778Z',
          events: [
            {
              label: 'Set game mode to TO-DO',
              date: '2025-08-19T21:28:03.778Z',
              type: EventType.GameModeChange,
            },
          ],
          icon: 'app_registration',
          progress: {
            green: 0,
            yellow: 0,
          },
          mainEventType: EventType.GameModeChange,
        },
        {
          date: '2025-08-19T21:27:55.596Z',
          events: [
            {
              label: 'Completed the game',
              date: '2025-08-19T21:27:55.596Z',
              type: EventType.GameModeCompletion,
              props: {
                gameMode: 'traditional',
                reward: 'traditional reward',
                deadline: '2025-08-22T21:00:00.000Z',
                beforeDeadline: true,
              },
            },
            {
              label: 'Set game mode to traditional',
              date: '2025-08-19T21:27:55.596Z',
              type: EventType.GameModeChange,
            },
          ],
          icon: 'trophy',
          progress: {
            green: 0,
            yellow: 0,
          },
          mainEventType: EventType.GameModeCompletion,
        },
        {
          date: '2025-08-19T21:27:46.427Z',
          events: [
            {
              date: '2025-08-19T21:27:46.427Z',
              label: 'Checked 4/9',
              type: EventType.Progress,
            },
            {
              label: 3,
              date: '2025-08-19T21:27:46.427Z',
              type: EventType.CellCheck,
            },
          ],
          mainEventType: EventType.Progress,
          icon: 'progressBar',
          progress: {
            green: 3,
            yellow: 4,
          },
        },
        {
          date: '2025-08-19T21:27:43.539Z',
          events: [
            {
              label: 'BINGO! First strike',
              date: '2025-08-19T21:27:43.539Z',
              type: EventType.FirstStrike,
            },
            {
              label: 0,
              date: '2025-08-19T21:27:43.539Z',
              type: EventType.CellCheck,
            },
            {
              label: 1,
              date: '2025-08-19T21:27:43.539Z',
              type: EventType.CellCheck,
            },
            {
              label: 2,
              date: '2025-08-19T21:27:43.539Z',
              type: EventType.CellCheck,
            },
          ],
          icon: 'firstStrike',
          progress: {
            green: 3,
            yellow: 3,
          },
          mainEventType: EventType.FirstStrike,
        },
        {
          date: '2025-08-19T21:27:37.066Z',
          events: [
            {
              label: 'Created board',
              date: '2025-08-19T21:27:37.066Z',
              type: EventType.Creation,
            },
          ],
          icon: 'app_registration',
          progress: {
            green: 0,
            yellow: 0,
          },
          mainEventType: EventType.Creation,
        },
      ])
    );
  });

  it('case: create todo, deadline, first strike, changed to traditional + complete, changed to TO-DO, check, halfway, check, deadline, complete', () => {
    fixture.componentRef.setInput(
      'board',
      new BoardInfo({
        Name: null,
        GameMode: 'todo',
        CreatedAtUtc: new Date('2025-08-19T21:36:37.988Z'),
        CreatedBy: 'local user',
        LastChangedAtUtc: new Date('2025-08-19T21:37:32.144Z'),
        Cells: [
          {
            Name: 0,
            CheckedDateUTC: new Date('2025-08-19T21:36:44.516Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 1,
            Column: 1,
          },
          {
            Name: 1,
            CheckedDateUTC: new Date('2025-08-19T21:36:44.516Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 1,
            Column: 2,
          },
          {
            Name: 2,
            CheckedDateUTC: new Date('2025-08-19T21:36:44.516Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 1,
            Column: 3,
          },
          {
            Name: 3,
            CheckedDateUTC: new Date('2025-08-19T21:37:04.755Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 2,
            Column: 1,
          },
          {
            Name: 4,
            CheckedDateUTC: new Date('2025-08-19T21:37:06.380Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 2,
            Column: 2,
          },
          {
            Name: 5,
            CheckedDateUTC: new Date('2025-08-19T21:37:08.228Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 2,
            Column: 3,
          },
          {
            Name: 6,
            CheckedDateUTC: new Date('2025-08-19T21:37:08.228Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 3,
            Column: 1,
          },
          {
            Name: 7,
            CheckedDateUTC: new Date('2025-08-19T21:37:32.144Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 3,
            Column: 2,
          },
          {
            Name: 8,
            CheckedDateUTC: new Date('2025-08-19T21:37:32.144Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 3,
            Column: 3,
          },
        ],
        Visibility: 'local',
        SwitchedToTodoAfterCompleteDateUtc: new Date(
          '2025-08-19T21:37:00.338Z'
        ),
        TraditionalGame: {
          CompletedAtUtc: new Date('2025-08-19T21:36:55.539Z'),
          CompletionReward: 'traditional reward',
          CompletionDeadlineUtc: new Date('2025-08-19T21:36:43.516Z'),
          CompletedByGameModeSwitch: true,
        },
        TodoGame: {
          CompletedAtUtc: new Date('2025-08-19T21:37:32.144Z'),
          CompletionReward: 'todo reward',
          CompletionDeadlineUtc: new Date('2025-08-19T21:37:30.144Z'),
        },
      })
    );

    expect(JSON.stringify(component.history())).toEqual(
      JSON.stringify([
        {
          date: '2025-08-19T21:37:32.144Z',
          events: [
            {
              label: 'Completed the game',
              date: '2025-08-19T21:37:32.144Z',
              type: EventType.GameModeCompletion,
              props: {
                gameMode: 'todo',
                reward: 'todo reward',
                deadline: '2025-08-19T21:37:30.144Z',
                beforeDeadline: false,
              },
            },
            {
              label: 7,
              date: '2025-08-19T21:37:32.144Z',
              type: EventType.CellCheck,
            },
            {
              label: 8,
              date: '2025-08-19T21:37:32.144Z',
              type: EventType.CellCheck,
            },
          ],
          icon: 'trophy',
          progress: {
            green: 9,
            yellow: 9,
          },
          mainEventType: EventType.GameModeCompletion,
        },
        {
          date: '2025-08-19T21:37:30.144Z',
          events: [
            {
              label: 'Deadline set for to-do game expired',
              date: '2025-08-19T21:37:30.144Z',
              type: EventType.DeadlineExpiry,
            },
          ],
          icon: 'hourglass_bottom',
          progress: {
            green: 0,
            yellow: 0,
          },
          mainEventType: EventType.DeadlineExpiry,
        },
        {
          date: '2025-08-19T21:37:08.228Z',
          events: [
            {
              date: '2025-08-19T21:37:08.228Z',
              label: 'Checked 7/9',
              type: EventType.Progress,
            },
            {
              label: 5,
              date: '2025-08-19T21:37:08.228Z',
              type: EventType.CellCheck,
            },
            {
              label: 6,
              date: '2025-08-19T21:37:08.228Z',
              type: EventType.CellCheck,
            },
          ],
          mainEventType: EventType.Progress,
          icon: 'progressBar',
          progress: {
            green: 7,
            yellow: 7,
          },
        },
        {
          date: '2025-08-19T21:37:06.380Z',
          events: [
            {
              label: 'Over halfway done',
              date: '2025-08-19T21:37:06.380Z',
              type: EventType.Halfway,
            },
            {
              label: 4,
              date: '2025-08-19T21:37:06.380Z',
              type: EventType.CellCheck,
            },
          ],
          icon: 'star_half',
          progress: {
            green: 3,
            yellow: 5,
          },
          mainEventType: EventType.Halfway,
        },
        {
          date: '2025-08-19T21:37:04.755Z',
          events: [
            {
              date: '2025-08-19T21:37:04.755Z',
              label: 'Checked 4/9',
              type: EventType.Progress,
            },
            {
              label: 3,
              date: '2025-08-19T21:37:04.755Z',
              type: EventType.CellCheck,
            },
          ],
          mainEventType: EventType.Progress,
          icon: 'progressBar',
          progress: {
            green: 3,
            yellow: 4,
          },
        },
        {
          date: '2025-08-19T21:37:00.338Z',
          events: [
            {
              label: 'Set game mode to TO-DO',
              date: '2025-08-19T21:37:00.338Z',
              type: EventType.GameModeChange,
            },
          ],
          icon: 'app_registration',
          progress: {
            green: 0,
            yellow: 0,
          },
          mainEventType: EventType.GameModeChange,
        },
        {
          date: '2025-08-19T21:36:55.539Z',
          events: [
            {
              label: 'Completed the game',
              date: '2025-08-19T21:36:55.539Z',
              type: EventType.GameModeCompletion,
              props: {
                gameMode: 'traditional',
                reward: 'traditional reward',
                deadline: '2025-08-19T21:36:43.516Z',
                beforeDeadline: false,
              },
            },
            {
              label: 'Set game mode to traditional',
              date: '2025-08-19T21:36:55.539Z',
              type: EventType.GameModeChange,
            },
          ],
          icon: 'trophy',
          progress: {
            green: 0,
            yellow: 0,
          },
          mainEventType: EventType.GameModeCompletion,
        },
        {
          date: '2025-08-19T21:36:44.516Z',
          events: [
            {
              label: 'BINGO! First strike',
              date: '2025-08-19T21:36:44.516Z',
              type: EventType.FirstStrike,
            },
            {
              label: 0,
              date: '2025-08-19T21:36:44.516Z',
              type: EventType.CellCheck,
            },
            {
              label: 1,
              date: '2025-08-19T21:36:44.516Z',
              type: EventType.CellCheck,
            },
            {
              label: 2,
              date: '2025-08-19T21:36:44.516Z',
              type: EventType.CellCheck,
            },
          ],
          icon: 'firstStrike',
          progress: {
            green: 3,
            yellow: 3,
          },
          mainEventType: EventType.FirstStrike,
        },
        {
          date: '2025-08-19T21:36:43.516Z',
          events: [
            {
              label: 'Deadline set for traditional game expired',
              date: '2025-08-19T21:36:43.516Z',
              type: EventType.DeadlineExpiry,
            },
          ],
          icon: 'hourglass_bottom',
          progress: {
            green: 0,
            yellow: 0,
          },
          mainEventType: EventType.DeadlineExpiry,
        },
        {
          date: '2025-08-19T21:36:37.988Z',
          events: [
            {
              label: 'Created board',
              date: '2025-08-19T21:36:37.988Z',
              type: EventType.Creation,
            },
          ],
          icon: 'app_registration',
          progress: {
            green: 0,
            yellow: 0,
          },
          mainEventType: EventType.Creation,
        },
      ])
    );
  });

  it('case: create traditional, checkx4 (minute separated), check, complete, continue, check3x, check, complete', () => {
    // this tests that halfway and first strike isn't added after reaching halfway and first strike by completing the game among others
    fixture.componentRef.setInput(
      'board',
      new BoardInfo({
        Name: null,
        GameMode: 'todo',
        CreatedAtUtc: new Date('2025-08-20T08:13:50.389Z'),
        CreatedBy: 'local user',
        LastChangedAtUtc: new Date('2025-08-20T08:23:04.690Z'),
        Cells: [
          {
            Name: 0,
            CheckedDateUTC: new Date('2025-08-20T08:13:52.472Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 1,
            Column: 1,
          },
          {
            Name: 1,
            CheckedDateUTC: new Date('2025-08-20T08:22:31.434Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 1,
            Column: 2,
          },
          {
            Name: 2,
            CheckedDateUTC: new Date('2025-08-20T08:14:02.220Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 1,
            Column: 3,
          },
          {
            Name: 3,
            CheckedDateUTC: new Date('2025-08-20T08:23:01.851Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 2,
            Column: 1,
          },
          {
            Name: 4,
            CheckedDateUTC: new Date('2025-08-20T08:16:12.618Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 2,
            Column: 2,
          },
          {
            Name: 5,
            CheckedDateUTC: new Date('2025-08-20T08:22:46.641Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 2,
            Column: 3,
          },
          {
            Name: 6,
            CheckedDateUTC: new Date('2025-08-20T08:15:18.337Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 3,
            Column: 1,
          },
          {
            Name: 7,
            CheckedDateUTC: new Date('2025-08-20T08:23:04.690Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 3,
            Column: 2,
          },
          {
            Name: 8,
            CheckedDateUTC: new Date('2025-08-20T08:16:10.517Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 3,
            Column: 3,
          },
        ],
        Visibility: 'local',
        SwitchedToTodoAfterCompleteDateUtc: new Date(
          '2025-08-20T08:22:28.024Z'
        ),
        TraditionalGame: {
          CompletedAtUtc: new Date('2025-08-20T08:16:12.618Z'),
          CompletionReward: null,
          CompletionDeadlineUtc: null,
          CompletedByGameModeSwitch: false,
        },
        TodoGame: {
          CompletedAtUtc: new Date('2025-08-20T08:23:04.690Z'),
          CompletionReward: null,
          CompletionDeadlineUtc: null,
        },
      })
    );

    expect(JSON.stringify(component.history())).toEqual(
      JSON.stringify([
        {
          date: '2025-08-20T08:23:04.690Z',
          events: [
            {
              label: 'Completed the game',
              date: '2025-08-20T08:23:04.690Z',
              type: EventType.GameModeCompletion,
              props: {
                gameMode: 'todo',
                reward: null,
                deadline: null,
                beforeDeadline: null,
              },
            },
            {
              label: 7,
              date: '2025-08-20T08:23:04.690Z',
              type: EventType.CellCheck,
            },
          ],
          icon: 'trophy',
          progress: {
            green: 9,
            yellow: 9,
          },
          mainEventType: EventType.GameModeCompletion,
        },
        {
          date: '2025-08-20T08:23:01.851Z',
          events: [
            {
              date: '2025-08-20T08:23:01.851Z',
              label: 'Checked 8/9',
              type: EventType.Progress,
            },
            {
              label: 3,
              date: '2025-08-20T08:23:01.851Z',
              type: EventType.CellCheck,
            },
            {
              label: 5,
              date: '2025-08-20T08:22:46.641Z',
              type: EventType.CellCheck,
            },
            {
              label: 1,
              date: '2025-08-20T08:22:31.434Z',
              type: EventType.CellCheck,
            },
          ],
          mainEventType: EventType.Progress,
          icon: 'progressBar',
          progress: {
            green: 8,
            yellow: 8,
          },
        },
        {
          date: '2025-08-20T08:22:28.024Z',
          events: [
            {
              label: 'Set game mode to TO-DO',
              date: '2025-08-20T08:22:28.024Z',
              type: EventType.GameModeChange,
            },
          ],
          icon: 'app_registration',
          progress: {
            green: 0,
            yellow: 0,
          },
          mainEventType: EventType.GameModeChange,
        },
        {
          date: '2025-08-20T08:16:12.618Z',
          events: [
            {
              label: 'Completed the game',
              date: '2025-08-20T08:16:12.618Z',
              type: EventType.GameModeCompletion,
              props: {
                gameMode: 'traditional',
                reward: null,
                deadline: null,
                beforeDeadline: null,
              },
            },
            {
              label: 4,
              date: '2025-08-20T08:16:12.618Z',
              type: EventType.CellCheck,
            },
          ],
          icon: 'trophy',
          progress: {
            green: 5,
            yellow: 5,
          },
          mainEventType: EventType.GameModeCompletion,
        },
        {
          date: '2025-08-20T08:16:10.517Z',
          events: [
            {
              date: '2025-08-20T08:16:10.517Z',
              label: 'Checked 4/9',
              type: EventType.Progress,
            },
            {
              label: 8,
              date: '2025-08-20T08:16:10.517Z',
              type: EventType.CellCheck,
            },
            {
              label: 6,
              date: '2025-08-20T08:15:18.337Z',
              type: EventType.CellCheck,
            },
            {
              label: 2,
              date: '2025-08-20T08:14:02.220Z',
              type: EventType.CellCheck,
            },
            {
              label: 0,
              date: '2025-08-20T08:13:52.472Z',
              type: EventType.CellCheck,
            },
          ],
          mainEventType: EventType.Progress,
          icon: 'progressBar',
          progress: {
            green: 0,
            yellow: 4,
          },
        },
        {
          date: '2025-08-20T08:13:50.389Z',
          events: [
            {
              label: 'Created board',
              date: '2025-08-20T08:13:50.389Z',
              type: EventType.Creation,
            },
          ],
          icon: 'app_registration',
          progress: {
            green: 0,
            yellow: 0,
          },
          mainEventType: EventType.Creation,
        },
      ])
    );
  });

  it('case: create todo, checkx4, check + first strike, check, changed to traditional + complete, continue, check', () => {
    // this tests that first check is added instead of halfway if they are reached at the same time and that halfway isn't added later
    fixture.componentRef.setInput(
      'board',
      new BoardInfo({
        Name: null,
        GameMode: 'todo',
        CreatedAtUtc: new Date('2025-08-20T08:33:45.788Z'),
        CreatedBy: 'local user',
        LastChangedAtUtc: new Date('2025-08-20T08:36:44.677Z'),
        Cells: [
          {
            Name: 0,
            CheckedDateUTC: new Date('2025-08-20T08:34:14.341Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 1,
            Column: 1,
          },
          {
            Name: 1,
            CheckedDateUTC: new Date('2025-08-20T08:34:36.670Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 1,
            Column: 2,
          },
          {
            Name: 2,
            CheckedDateUTC: new Date('2025-08-20T08:34:14.341Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 1,
            Column: 3,
          },
          {
            Name: 3,
            CheckedDateUTC: new Date('2025-08-20T08:34:23.176Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 2,
            Column: 1,
          },
          {
            Name: 4,
            CheckedDateUTC: null,
            IsInBingoPattern: false,
            Selected: false,
            Row: 2,
            Column: 2,
          },
          {
            Name: 5,
            CheckedDateUTC: new Date('2025-08-20T08:36:44.677Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 2,
            Column: 3,
          },
          {
            Name: 6,
            CheckedDateUTC: new Date('2025-08-20T08:34:14.341Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 3,
            Column: 1,
          },
          {
            Name: 7,
            CheckedDateUTC: null,
            IsInBingoPattern: false,
            Selected: false,
            Row: 3,
            Column: 2,
          },
          {
            Name: 8,
            CheckedDateUTC: new Date('2025-08-20T08:34:14.341Z'),
            IsInBingoPattern: true,
            Selected: false,
            Row: 3,
            Column: 3,
          },
        ],
        Visibility: 'local',
        SwitchedToTodoAfterCompleteDateUtc: new Date(
          '2025-08-20T08:36:42.579Z'
        ),
        TraditionalGame: {
          CompletedAtUtc: new Date('2025-08-20T08:34:59.597Z'),
          CompletionReward: null,
          CompletionDeadlineUtc: null,
          CompletedByGameModeSwitch: true,
        },
        TodoGame: {
          CompletedAtUtc: null,
          CompletionReward: null,
          CompletionDeadlineUtc: null,
        },
      })
    );

    expect(JSON.stringify(component.history())).toEqual(
      JSON.stringify([
        {
          date: '2025-08-20T08:36:44.677Z',
          events: [
            {
              date: '2025-08-20T08:36:44.677Z',
              label: 'Checked 7/9',
              type: EventType.Progress,
            },
            {
              label: 5,
              date: '2025-08-20T08:36:44.677Z',
              type: EventType.CellCheck,
            },
          ],
          mainEventType: EventType.Progress,
          icon: 'progressBar',
          progress: {
            green: 7,
            yellow: 7,
          },
        },
        {
          date: '2025-08-20T08:36:42.579Z',
          events: [
            {
              label: 'Set game mode to TO-DO',
              date: '2025-08-20T08:36:42.579Z',
              type: EventType.GameModeChange,
            },
          ],
          icon: 'app_registration',
          progress: {
            green: 0,
            yellow: 0,
          },
          mainEventType: EventType.GameModeChange,
        },
        {
          date: '2025-08-20T08:34:59.597Z',
          events: [
            {
              label: 'Completed the game',
              date: '2025-08-20T08:34:59.597Z',
              type: EventType.GameModeCompletion,
              props: {
                gameMode: 'traditional',
                reward: null,
                deadline: null,
                beforeDeadline: null,
              },
            },
            {
              label: 'Set game mode to traditional',
              date: '2025-08-20T08:34:59.597Z',
              type: EventType.GameModeChange,
            },
          ],
          icon: 'trophy',
          progress: {
            green: 0,
            yellow: 0,
          },
          mainEventType: EventType.GameModeCompletion,
        },
        {
          date: '2025-08-20T08:34:36.670Z',
          events: [
            {
              date: '2025-08-20T08:34:36.670Z',
              label: 'Checked 6/9',
              type: EventType.Progress,
            },
            {
              label: 1,
              date: '2025-08-20T08:34:36.670Z',
              type: EventType.CellCheck,
            },
          ],
          mainEventType: EventType.Progress,
          icon: 'progressBar',
          progress: {
            green: 5,
            yellow: 6,
          },
        },
        {
          date: '2025-08-20T08:34:23.176Z',
          events: [
            {
              label: 'BINGO! First strike',
              date: '2025-08-20T08:34:23.176Z',
              type: EventType.FirstStrike,
            },
            {
              label: 3,
              date: '2025-08-20T08:34:23.176Z',
              type: EventType.CellCheck,
            },
          ],
          icon: 'firstStrike',
          progress: {
            green: 3,
            yellow: 5,
          },
          mainEventType: EventType.FirstStrike,
        },
        {
          date: '2025-08-20T08:34:14.341Z',
          events: [
            {
              date: '2025-08-20T08:34:14.341Z',
              label: 'Checked 4/9',
              type: EventType.Progress,
            },
            {
              label: 0,
              date: '2025-08-20T08:34:14.341Z',
              type: EventType.CellCheck,
            },
            {
              label: 2,
              date: '2025-08-20T08:34:14.341Z',
              type: EventType.CellCheck,
            },
            {
              label: 6,
              date: '2025-08-20T08:34:14.341Z',
              type: EventType.CellCheck,
            },
            {
              label: 8,
              date: '2025-08-20T08:34:14.341Z',
              type: EventType.CellCheck,
            },
          ],
          mainEventType: EventType.Progress,
          icon: 'progressBar',
          progress: {
            green: 0,
            yellow: 4,
          },
        },
        {
          date: '2025-08-20T08:33:45.788Z',
          events: [
            {
              label: 'Created board',
              date: '2025-08-20T08:33:45.788Z',
              type: EventType.Creation,
            },
          ],
          icon: 'app_registration',
          progress: {
            green: 0,
            yellow: 0,
          },
          mainEventType: EventType.Creation,
        },
      ])
    );
  });
});
