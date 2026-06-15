import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SeatGrid from '../../components/SeatGrid';

const sampleLayout = {
  screen: { position: 'top' },
  rows: [
    {
      label: 'A',
      seats: [
        { id: 'A1' },
        { id: 'A2', blocked: true },
        { id: 'A3' },
      ],
    },
    {
      label: 'B',
      seats: [
        { id: 'B1' },
        { id: 'B2' },
      ],
    },
  ],
};

describe('SeatGrid', () => {
  it('renders no-seat message when layout is empty', () => {
    render(<SeatGrid layout={{ rows: [] }} />);
    expect(screen.getByText('No seat layout defined')).toBeInTheDocument();
  });

  it('renders no-seat message when layout is null', () => {
    render(<SeatGrid layout={null} />);
    expect(screen.getByText('No seat layout defined')).toBeInTheDocument();
  });

  it('renders all seat buttons from layout', () => {
    render(<SeatGrid layout={sampleLayout} />);
    expect(screen.getByTitle('A1')).toBeInTheDocument();
    expect(screen.getByTitle('A2 (blocked)')).toBeInTheDocument();
    expect(screen.getByTitle('A3')).toBeInTheDocument();
    expect(screen.getByTitle('B1')).toBeInTheDocument();
    expect(screen.getByTitle('B2')).toBeInTheDocument();
  });

  it('shows screen label', () => {
    render(<SeatGrid layout={sampleLayout} />);
    expect(screen.getByText('Screen')).toBeInTheDocument();
  });

  it('shows legend items', () => {
    render(<SeatGrid layout={sampleLayout} />);
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Selected')).toBeInTheDocument();
    expect(screen.getByText('Booked')).toBeInTheDocument();
    expect(screen.getByText('Blocked')).toBeInTheDocument();
  });

  it('marks blocked seats as disabled', () => {
    render(<SeatGrid layout={sampleLayout} />);
    const blockedButton = screen.getByTitle('A2 (blocked)');
    expect(blockedButton).toBeDisabled();
  });

  it('marks booked seats as disabled', () => {
    render(<SeatGrid layout={sampleLayout} available={['A1', 'A3', 'B1', 'B2']} booked={['A1']} />);
    const seatA1 = screen.getByTitle('A1 (booked)');
    expect(seatA1).toBeDisabled();
  });

  it('calls onToggle when clicking available seat', () => {
    const onToggle = vi.fn();
    render(<SeatGrid layout={sampleLayout} onToggle={onToggle} />);
    fireEvent.click(screen.getByTitle('A1'));
    expect(onToggle).toHaveBeenCalledWith('A1');
  });

  it('does not call onToggle when clicking blocked seat', () => {
    const onToggle = vi.fn();
    render(<SeatGrid layout={sampleLayout} onToggle={onToggle} />);
    const blocked = screen.getByTitle('A2 (blocked)');
    expect(blocked).toBeDisabled();
    fireEvent.click(blocked);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('shows selected seats with selected class', () => {
    render(<SeatGrid layout={sampleLayout} selected={['A1', 'B2']} />);
    const seatA1 = screen.getByTitle('A1');
    expect(seatA1.className).toContain('selected');
  });

  it('applies compact styles when compact prop is true', () => {
    render(<SeatGrid layout={sampleLayout} compact />);
    const seatButton = screen.getByTitle('A1');
    expect(seatButton.style.width).toBe('32px');
  });

  it('disables all seats when readOnly is true', () => {
    render(<SeatGrid layout={sampleLayout} readOnly />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      expect(btn.disabled).toBe(true);
    });
  });
});
