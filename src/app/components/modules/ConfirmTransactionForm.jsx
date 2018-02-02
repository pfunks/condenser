import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import * as transactionActions from 'app/redux/TransactionReducer';
import { findParent } from 'app/utils/DomUtils';
import tt from 'counterpart';
import * as voteActions from 'app/redux/VoteReducer';
import Slider from 'react-rangeslider';

class ConfirmTransactionForm extends Component {
    static propTypes = {
        //Steemit
        onCancel: PropTypes.func,
        warning: PropTypes.string,
        checkbox: PropTypes.string,
        weight: PropTypes.number,
        updateWeightNegative: PropTypes.func,
        // redux-form
        confirm: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
        confirmBroadcastOperation: PropTypes.object,
        confirmErrorCallback: PropTypes.func,
        okClick: PropTypes.func,
    };
    constructor() {
        super();
        this.state = { checkboxChecked: false };
    }
    componentDidMount() {
        document.body.addEventListener('click', this.closeOnOutsideClick);
    }
    componentWillUnmount() {
        document.body.removeEventListener('click', this.closeOnOutsideClick);
    }
    closeOnOutsideClick = e => {
        const inside_dialog = findParent(e.target, 'ConfirmTransactionForm');
        if (!inside_dialog) this.onCancel();
    };
    onCancel = () => {
        const { confirmErrorCallback, onCancel } = this.props;
        if (confirmErrorCallback) confirmErrorCallback();
        if (onCancel) onCancel();
    };
    okClick = () => {
        const { okClick, confirmBroadcastOperation, weight } = this.props;
        // User had the opportunity to adjust the voting weight?
        const showVoteWeightSlider = confirmBroadcastOperation.getIn([
            'operation',
            'showVoteWeightSlider',
        ]);
        // If user was shown the voting slider, take the updated weight from the store.
        if (showVoteWeightSlider) {
            const updatedBroadcastOperation = confirmBroadcastOperation.setIn(
                ['operation', 'weight'],
                weight
            );
            okClick(updatedBroadcastOperation);
        } else okClick(confirmBroadcastOperation);
    };
    onCheckbox = e => {
        const checkboxChecked = e.target.checked;
        this.setState({ checkboxChecked });
    };
    render() {
        const { onCancel, okClick, onCheckbox } = this;
        const {
            confirm,
            confirmBroadcastOperation,
            warning,
            checkbox,
            updateWeightNegative,
            weight,
        } = this.props;
        const showVoteWeightSlider = confirmBroadcastOperation.getIn([
            'operation',
            'showVoteWeightSlider',
        ]);
        const { checkboxChecked } = this.state;
        const conf = typeof confirm === 'function' ? confirm() : confirm;
        return (
            <div className="ConfirmTransactionForm">
                <h4>{typeName(confirmBroadcastOperation)}</h4>
                <hr />
                {showVoteWeightSlider && (
                    <div>
                    {console.log('INIT WEIGHT', weight)}
                        
                        <div className="Voting__adjust_weight">
                            <div className="weight-display">
                                {weight / 100}%
                            </div>
                            <Slider
                                min={100}
                                max={10000}
                                step={100}
                                // Cast a negative weight value to positive so the slider can handle it...
                                value={weight * -1}
                                onChange={updateWeightNegative}
                            />
                        </div>
                    </div>
                )}
                <div>{conf}</div>
                {warning ? (
                    <div
                        style={{ paddingTop: 10, fontWeight: 'bold' }}
                        className="error"
                    >
                        {warning}
                    </div>
                ) : null}
                {checkbox ? (
                    <div>
                        <label htmlFor="checkbox">
                            <input
                                id="checkbox"
                                type="checkbox"
                                checked={checkboxChecked}
                                onChange={this.onCheckbox}
                            />
                            {checkbox}
                        </label>
                    </div>
                ) : null}
                <br />
                <button
                    className="button"
                    onClick={okClick}
                    disabled={!(checkbox === undefined || checkboxChecked)}
                >
                    {tt('g.ok')}
                </button>
                <button
                    type="button hollow"
                    className="button hollow"
                    onClick={onCancel}
                >
                    {tt('g.cancel')}
                </button>
            </div>
        );
    }
}
const typeName = confirmBroadcastOperation => {
    const title = confirmBroadcastOperation.getIn([
        'operation',
        '__config',
        'title',
    ]);
    if (title) return title;
    const type = confirmBroadcastOperation.get('type');
    return (
        tt('g.confirm') +
        ' ' +
        type
            .split('_')
            .map(n => n.charAt(0).toUpperCase() + n.substring(1))
            .join(' ')
    );
};

export default connect(
    // mapStateToProps
    state => {
        const confirmBroadcastOperation = state.transaction.get(
            'confirmBroadcastOperation'
        );
        const confirmErrorCallback = state.transaction.get(
            'confirmErrorCallback'
        );
        const confirm = state.transaction.get('confirm');
        const warning = state.transaction.get('warning');
        const checkbox = state.transaction.get('checkbox');
        const weight = state.vote.get('weight');
        return {
            confirmBroadcastOperation,
            confirmErrorCallback,
            confirm,
            warning,
            checkbox,
            weight,
        };
    },
    // mapDispatchToProps
    dispatch => ({
        // Hack to cast the slider values to negative.
        updateWeightNegative: weight => {
            const negativeWeight = weight * -1;
            dispatch(voteActions.updateWeight({ weight: negativeWeight}));
        },
        okClick: confirmBroadcastOperation => {
            dispatch(transactionActions.hideConfirm());
            dispatch(
                transactionActions.broadcastOperation({
                    ...confirmBroadcastOperation.toJS(),
                })
            );
        },
    })
)(ConfirmTransactionForm);
