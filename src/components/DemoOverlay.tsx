import React from 'react';
import { DemoHome }      from './demo/DemoHome';
import { DemoFoods }     from './demo/DemoFoods';
import { DemoOFF }       from './demo/DemoOFF';
import { DemoCIQUAL }    from './demo/DemoCIQUAL';
import { DemoScanner }   from './demo/DemoScanner';
import { DemoFoodPhoto } from './demo/DemoFoodPhoto';
import { DemoSaved }     from './demo/DemoSaved';

export type DemoScenario = 'home' | 'foods' | 'off' | 'ciqual' | 'scanner' | 'photo' | 'saved';

interface Props {
  scenario: DemoScenario | null;
  onClose:  () => void;
}

export function DemoOverlay({ scenario, onClose }: Props) {
  return (
    <>
      <DemoHome      visible={scenario === 'home'}    onClose={onClose} />
      <DemoFoods     visible={scenario === 'foods'}   onClose={onClose} />
      <DemoOFF       visible={scenario === 'off'}     onClose={onClose} />
      <DemoCIQUAL    visible={scenario === 'ciqual'}  onClose={onClose} />
      <DemoScanner   visible={scenario === 'scanner'} onClose={onClose} />
      <DemoFoodPhoto visible={scenario === 'photo'}   onClose={onClose} />
      <DemoSaved     visible={scenario === 'saved'}   onClose={onClose} />
    </>
  );
}
