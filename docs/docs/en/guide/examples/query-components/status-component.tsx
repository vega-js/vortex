import React from 'react';
import { Button } from '@components/button';
import { Card } from '@components/card';
import { RenderCount } from '@components/render-count';
import { Text } from '@components/text';
import { defineStore, useStore } from '@vegajs/vortex';
import type { User } from './repo';
import UsersRepo from './repo';

const loadingStore = defineStore(({ query }) => {
  const usersRepo = new UsersRepo();

  const usersQuery = query<User[], Error>(usersRepo.getUsers, {
    isAutorun: true,
  });

  return {
    usersQuery,
    refetch: usersQuery.refetch,
  };
});

const StatusComponent = () => {
  const { usersQuery, refetch } = useStore(loadingStore);

  return (
    <Card>
      <RenderCount />
      <Button onClick={refetch}>Refetch</Button>

      {usersQuery.isLoading && <Text>Loading...</Text>}
      {usersQuery.isError && <Text>{usersQuery.error?.message}</Text>}
      {!usersQuery.isLoading && !usersQuery.isError && (
        <>
          <Text>First User: {usersQuery.data?.[0]?.name}</Text>
        </>
      )}

      <Card>
        <Text>Error: {usersQuery.error?.message || `${null}`}</Text>
        <Text>isLoading: {usersQuery.isLoading.toString()}</Text>
        <Text>isError: {usersQuery.isError.toString()}</Text>
        <Text>isSuccess: {usersQuery.isSuccess.toString()}</Text>
      </Card>
    </Card>
  );
};

export default StatusComponent;
