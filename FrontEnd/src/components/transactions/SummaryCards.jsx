import { Card, Col, Row, Statistic } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faArrowUp, faWallet } from '@fortawesome/free-solid-svg-icons';

import { formatMoney } from '../../helpers/transactions';

const SummaryCards = ({ summary }) => {
  const { income = 0, expense = 0, balance = 0, count = 0 } = summary || {};

  return (
    <Row gutter={[16, 16]} className="mb-5">
      <Col xs={24} sm={8}>
        <Card className="border-0 shadow-sm">
          <Statistic
            title="Income"
            value={formatMoney(income)}
            prefix={<FontAwesomeIcon icon={faArrowUp} className="mr-2 text-green-600" />}
            valueStyle={{ color: '#16a34a', fontSize: 22 }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card className="border-0 shadow-sm">
          <Statistic
            title="Expenses"
            value={formatMoney(expense)}
            prefix={<FontAwesomeIcon icon={faArrowDown} className="mr-2 text-red-500" />}
            valueStyle={{ color: '#dc2626', fontSize: 22 }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card className="border-0 shadow-sm">
          <Statistic
            title={`Balance · ${count} entries`}
            value={formatMoney(balance)}
            prefix={<FontAwesomeIcon icon={faWallet} className="text-primary mr-2" />}
            valueStyle={{ color: balance >= 0 ? '#0f766e' : '#b91c1c', fontSize: 22 }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default SummaryCards;
