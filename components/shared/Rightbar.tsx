import { currentUser } from "@clerk/nextjs";

import UserCard from "../cards/UserCard";

import { fetchCommunities } from "@/lib/actions/community.actions";
import { fetchUsers } from "@/lib/actions/user.actions";

const Rightbar = async () => {
  const user = await currentUser();
  if (!user) return null;

  const similarMinds = await fetchUsers({
    userId: user.id,
    pageSize: 4,
  });

  const suggestedCommunities = await fetchCommunities({ pageSize: 4 });

  return (
    <section className="custom-scrollbar rightsidebar">
      <div className="flex flex-col flex-1 justify-start">
        <h3 className="text-heading4-medium text-light-1">Suggested Communities</h3>
        <div className="mt-7 flex flex-col gap-8 w-[320px]">
          {suggestedCommunities.communities.length > 0 ? (
            <>
              {suggestedCommunities.communities.map((community) => (
                <UserCard
                  key={community.id}
                  id={community.id}
                  name={community.name}
                  username={community.username}
                  imgUrl={community.image}
                  personType="Community"
                />
              ))}
            </>
          ) : (
            <p className="!text-base-regular text-light-1">No communities yet</p>
          )}
        </div>
      </div>

      <div className="flex flex-col flex-1 justify-start">
        <h3 className="text-heading4-medium text-light-1">Similar Minds</h3>
        <div className="mt-7 flex flex-col gap-8 w-[320px]">
          {similarMinds.users.length > 0 ? (
            <>
              {similarMinds.users.map((user) => (
                <UserCard
                  key={user.id}
                  id={user.id}
                  name={user.name}
                  username={user.username}
                  imgUrl={user.image}
                  personType="User"
                />
              ))}
            </>
          ) : (
            <p className="!text-base-regular text-light-1">No users yet</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Rightbar;
