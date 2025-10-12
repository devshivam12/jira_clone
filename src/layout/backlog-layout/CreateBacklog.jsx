import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SprintTable from '@/components/data-table/create-sprint-data-table';

const CreateBacklog = ({ createSprint, onIssueClick, selectedIssue, setSelectedIssue }) => {

  return (
    <Card className="w-full border-0 bg-none bg-card-none shadow-none border-bg-0 outline-none p-4 min-h-[100px] transition-all duration-300 rounded-none ">
      
      <SprintTable />
      
    </Card>
  );
};

export default CreateBacklog;