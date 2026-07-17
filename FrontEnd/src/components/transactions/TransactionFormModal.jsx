import { useEffect, useState } from 'react';
import { DatePicker, Form, Input, InputNumber, Modal, Select } from 'antd';
import dayjs from 'dayjs';

import { getCategoriesForType, TRANSACTION_TYPES } from '../../helpers/transactions';

const TransactionFormModal = ({ open, initialValues, loading, onCancel, onSubmit }) => {
  const [form] = Form.useForm();
  const [type, setType] = useState(initialValues?.type || TRANSACTION_TYPES.EXPENSE);

  useEffect(() => {
    if (!open) return;

    const nextType = initialValues?.type || TRANSACTION_TYPES.EXPENSE;
    setType(nextType);

    form.setFieldsValue({
      type: nextType,
      amount: initialValues?.amount,
      category: initialValues?.category,
      date: initialValues?.date ? dayjs(initialValues.date) : dayjs(),
      description: initialValues?.description || ''
    });
  }, [open, initialValues, form]);

  const handleTypeChange = value => {
    setType(value);
    const categories = getCategoriesForType(value);
    const currentCategory = form.getFieldValue('category');
    if (!categories.includes(currentCategory)) {
      form.setFieldValue('category', undefined);
    }
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit({
      ...values,
      date: values.date.format('YYYY-MM-DD'),
      description: values.description?.trim() || ''
    });
  };

  return (
    <Modal
      title={initialValues?._id ? 'Edit transaction' : 'Add transaction'}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      destroyOnClose
      okText={initialValues?._id ? 'Save changes' : 'Add entry'}
    >
      <Form form={form} layout="vertical" requiredMark={false} className="mt-4">
        <Form.Item name="type" label="Type" rules={[{ required: true, message: 'Select a type' }]}>
          <Select
            onChange={handleTypeChange}
            options={[
              { value: TRANSACTION_TYPES.EXPENSE, label: 'Expense' },
              { value: TRANSACTION_TYPES.INCOME, label: 'Income' }
            ]}
          />
        </Form.Item>

        <Form.Item
          name="amount"
          label="Amount"
          rules={[
            { required: true, message: 'Enter an amount' },
            {
              type: 'number',
              min: 0.01,
              message: 'Amount must be greater than 0'
            }
          ]}
        >
          <InputNumber className="w-full" min={0.01} step={0.01} precision={2} placeholder="0.00" />
        </Form.Item>

        <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Select a category' }]}>
          <Select
            placeholder="Select category"
            options={getCategoriesForType(type).map(category => ({ value: category, label: category }))}
          />
        </Form.Item>

        <Form.Item name="date" label="Date" rules={[{ required: true, message: 'Select a date' }]}>
          <DatePicker className="w-full" format="YYYY-MM-DD" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} maxLength={500} showCount placeholder="Optional note" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TransactionFormModal;
