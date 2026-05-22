import React from 'react';
import { DemoHome }  from './demo/DemoHome';
import { DemoFoods } from './demo/DemoFoods';
import { DemoOFF }   from './demo/DemoOFF';

export type DemoScenario = 'home' | 'foods' | 'off';

interface Props {
  scenario: DemoScenario | null;
  onClose:  () => void;
}

export function DemoOverlay({ scenario, onClose }: Props) {
  return (
    <>
      <DemoHome  visible={scenario === 'home'}  onClose={onClose} />
      <DemoFoods visible={scenario === 'foods'} onClose={onClose} />
      <DemoOFF   visible={scenario === 'off'}   onClose={onClose} />
    </>
  );
}
