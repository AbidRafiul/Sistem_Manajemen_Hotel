import React from 'react';
import { Stepper } from 'primereact/stepper';
import { StepperPanel } from 'primereact/stepperpanel';
import { ReservasiBaruState, initValue } from './interfaces';
import { FormikProps } from 'formik';
import { Toast } from 'primereact/toast';
import StepGuest from './step_guest';
import StepAvailability from './step_availability';
import StepPayment from './step_payment';
import StepConfirmation from './step_confirmation';

interface FormWalkInProps {
    state: ReservasiBaruState;
    setState: React.Dispatch<React.SetStateAction<ReservasiBaruState>>;
    formik: FormikProps<initValue>;
    toast: React.RefObject<Toast>;
}

const FormWalkIn: React.FC<FormWalkInProps> = ({ state, setState, formik, toast }) => {
    return (
        <div className="card">
            <Stepper 
                activeStep={state.activeStep} 
                onChangeStep={(e) => setState(prev => ({ ...prev, activeStep: e.index }))}
                linear={true}
            >
                <StepperPanel header="Data Tamu">
                    <StepGuest state={state} setState={setState} formik={formik} toast={toast} />
                </StepperPanel>
                <StepperPanel header="Ketersediaan & Rate">
                    <StepAvailability state={state} setState={setState} formik={formik} toast={toast} />
                </StepperPanel>
                <StepperPanel header="Deposit & Pembayaran">
                    <StepPayment state={state} setState={setState} formik={formik} toast={toast} />
                </StepperPanel>
                <StepperPanel header="Konfirmasi">
                    <StepConfirmation state={state} setState={setState} formik={formik} toast={toast} />
                </StepperPanel>
            </Stepper>
        </div>
    );
};

export default FormWalkIn;
