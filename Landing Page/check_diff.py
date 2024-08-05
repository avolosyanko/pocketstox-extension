def read_file_to_set(file_path):
    with open(file_path, 'r') as file:
        return set(line.strip() for line in file)


def main():
    # Read files
    following_set = read_file_to_set('following.txt')
    followers_set = read_file_to_set('followers.txt')

    # Find differences
    unique_following = following_set - followers_set
    unique_followers = followers_set - following_set

    # Print differences
    print("Unique in following.txt:")
    print(unique_following)
    print("Unique in followers.txt:")
    print(unique_followers)

if __name__ == "__main__":
    main()