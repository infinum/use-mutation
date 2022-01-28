import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useMutation from '../src';
// @ts-ignore
import MutationObserver from 'mutation-observer';

window.MutationObserver = MutationObserver;

function Tester({
  mutationFn,
  onMutate,
  onSuccess,
  onFailure,
  onSettled,
}: {
  mutationFn: () => Promise<any>;
  onMutate: () => any;
  onSuccess: () => any;
  onFailure: () => any;
  onSettled: () => any;
}) {
  const [mutate, { status }] = useMutation(mutationFn, {
    onMutate,
    onSuccess,
    onFailure,
    onSettled,
  });

  return <button onClick={() => mutate('test-1')}>{status}</button>;
}

describe(useMutation, () => {
  test('should call all the correct function for a successful mutation', async () => {
    const mutationFn = jest.fn(() => Promise.resolve('result-1'));
    const onMutate = jest.fn();
    const onSuccess = jest.fn();
    const onFailure = jest.fn();
    const onSettled = jest.fn();

    render(
      <Tester
        mutationFn={mutationFn}
        onMutate={onMutate}
        onSuccess={onSuccess}
        onFailure={onFailure}
        onSettled={onSettled}
      />
    );

    userEvent.click(screen.getByRole('button'));

    await screen.findByText('running');

    expect(mutationFn).toHaveBeenCalledWith('test-1');
    expect(onMutate).toHaveBeenCalledWith({ input: 'test-1' });
    expect(onSuccess).toHaveBeenCalledWith({
      data: 'result-1',
      input: 'test-1',
    });
    expect(onFailure).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledWith({
      status: 'success',
      data: 'result-1',
      input: 'test-1',
    });
  });

  test('should call all the correct function for a failure mutation', async () => {
    const noop = jest.fn();
    const mutationFn = jest.fn(() => Promise.reject('reason-1'));
    const onMutate = jest.fn(() => noop);
    const onSuccess = jest.fn();
    const onFailure = jest.fn();
    const onSettled = jest.fn();

    render(
      <Tester
        mutationFn={mutationFn}
        onMutate={onMutate}
        onSuccess={onSuccess}
        onFailure={onFailure}
        onSettled={onSettled}
      />
    );

    userEvent.click(screen.getByRole('button'));

    await screen.findByText('running');

    expect(mutationFn).toHaveBeenCalledWith('test-1');
    expect(onMutate).toHaveBeenCalledWith({ input: 'test-1' });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onFailure).toHaveBeenCalledWith({
      error: 'reason-1',
      rollback: noop,
      input: 'test-1',
    });
    expect(onSettled).toHaveBeenCalledWith({
      status: 'failure',
      error: 'reason-1',
      input: 'test-1',
      rollback: noop,
    });
  });

  test('should reassign callbacks to new value on each render', async () => {
    const onMutate = jest.fn();
    const onSuccess = jest.fn();
    const onFailure = jest.fn();
    const onSettled = jest.fn();

    type ICallback = (id: number) => void;
    interface Props {
      onMutate: ICallback;
      onSuccess: ICallback;
      onFailure: ICallback;
      onSettled: ICallback;
    }

    function Test({ onMutate, onSuccess, onFailure, onSettled }: Props) {
      const [count, setCount] = React.useState(() => 0);

      const [mutate, {status}] = useMutation(() => Promise.resolve('result-1'), {
        onMutate: () => {
          onMutate(count);
        },
        onSuccess: () => {
          onSuccess(count);
        },
        onFailure: () => {
          onFailure(count);
        },
        onSettled: () => {
          onSettled(count);
        },
      });

      return (
        <>
          <div>{status}</div>
          <button onClick={() => mutate('test-1')}>mutate</button>
          <button onClick={() => setCount(currentId => currentId + 1)}>
            increment
          </button>
        </>
      );
    }

    render(
      <Test
        onMutate={onMutate}
        onSuccess={onSuccess}
        onFailure={onFailure}
        onSettled={onSettled}
      />
    );

    userEvent.click(screen.getByText('mutate'));

    await screen.findByText('running');

    expect(onMutate).toHaveBeenCalledWith(0);
    expect(onSuccess).toHaveBeenCalledWith(0);
    expect(onFailure).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledWith(0);

    userEvent.click(screen.getByText('increment'));
    userEvent.click(screen.getByText('mutate'));

    await screen.findByText('running');

    expect(onMutate).toHaveBeenCalledWith(1);
    expect(onSuccess).toHaveBeenCalledWith(1);
    expect(onFailure).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledWith(1);
  });
});
