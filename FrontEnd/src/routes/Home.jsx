import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';

import Api from '../helpers/core/Api';
import ContentPanel from '../components/core/layout/ContentPanel';
import SummaryCards from '../components/transactions/SummaryCards';
import TransactionFormModal from '../components/transactions/TransactionFormModal';
import { formatMoney, TRANSACTION_TYPES } from '../helpers/transactions';

const emptySummary = { income: 0, expense: 0, balance: 0, count: 0 };

const Home = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        sorter: '-date',
        ...(typeFilter ? { type: typeFilter } : {}),
        ...(search ? { filter: search } : {})
      };

      const [listRes, summaryRes] = await Promise.all([
        Api.get('/transactions', { params }),
        Api.get('/transactions/summary')
      ]);

      setTransactions(listRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      error.globalHandler?.();
    } finally {
      setLoading(false);
    }
  }, [typeFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = record => {
    setEditing(record);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSubmit = async values => {
    setSaving(true);
    try {
      if (editing?._id) {
        await Api.put(`/transactions/${editing._id}`, values);
        message.success('Transaction updated');
      } else {
        await Api.post('/transactions', values);
        message.success('Transaction added');
      }
      closeModal();
      await loadData();
    } catch (error) {
      error.globalHandler?.();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async id => {
    try {
      await Api.delete(`/transactions/${id}`);
      message.success('Transaction deleted');
      await loadData();
    } catch (error) {
      error.globalHandler?.();
    }
  };

  const columns = useMemo(
    () => [
      {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
        sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
        render: value => dayjs(value).format('MMM D, YYYY'),
        width: 140
      },
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        width: 110,
        render: value => (
          <Tag color={value === TRANSACTION_TYPES.INCOME ? 'green' : 'red'}>
            {value === TRANSACTION_TYPES.INCOME ? 'Income' : 'Expense'}
          </Tag>
        )
      },
      {
        title: 'Category',
        dataIndex: 'category',
        key: 'category',
        width: 140
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
        render: value => value || <span className="text-gray-400">—</span>
      },
      {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        align: 'right',
        width: 130,
        sorter: (a, b) => a.amount - b.amount,
        render: (value, record) => (
          <span
            className={
              record.type === TRANSACTION_TYPES.INCOME ? 'font-semibold text-green-600' : 'font-semibold text-red-500'
            }
          >
            {record.type === TRANSACTION_TYPES.INCOME ? '+' : '-'}
            {formatMoney(value)}
          </span>
        )
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 120,
        render: (_, record) => (
          <Space>
            <Button type="text" icon={<FontAwesomeIcon icon={faPen} />} onClick={() => openEdit(record)} />
            <Popconfirm
              title="Delete this transaction?"
              description="This action cannot be undone."
              okText="Delete"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record._id)}
            >
              <Button type="text" danger icon={<FontAwesomeIcon icon={faTrash} />} />
            </Popconfirm>
          </Space>
        )
      }
    ],
    []
  );

  return (
    <ContentPanel
      title="Expense & Income Diary"
      subtitle="Track daily money in and out"
      loading={false}
      titleAction={
        <Button type="primary" icon={<FontAwesomeIcon icon={faPlus} />} onClick={openCreate}>
          Add transaction
        </Button>
      }
    >
      <SummaryCards summary={summary} />

      <Space wrap className="mb-4 w-full justify-between">
        <Space wrap>
          <Select
            allowClear
            placeholder="Filter by type"
            className="w-40"
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: TRANSACTION_TYPES.INCOME, label: 'Income' },
              { value: TRANSACTION_TYPES.EXPENSE, label: 'Expense' }
            ]}
          />
          <Input.Search
            allowClear
            placeholder="Search description or category"
            className="w-64"
            onSearch={setSearch}
            onChange={e => {
              if (!e.target.value) setSearch('');
            }}
          />
        </Space>
      </Space>

      <Table
        rowKey="_id"
        loading={loading}
        columns={columns}
        dataSource={transactions}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        scroll={{ x: 720 }}
        locale={{ emptyText: 'No transactions yet. Add your first entry to get started.' }}
      />

      <TransactionFormModal
        open={modalOpen}
        initialValues={editing}
        loading={saving}
        onCancel={closeModal}
        onSubmit={handleSubmit}
      />
    </ContentPanel>
  );
};

export default Home;
